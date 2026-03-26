import fs from 'fs';

const edits = [
    {
        file: 'src/app/admin/tests/page.tsx',
        search: '<input type="date" required style={inputStyle} value={formData.test_date} onChange={e => setFormData({ ...formData, test_date: e.target.value })} />',
        replace: '<DatePicker selected={formData.test_date ? new Date(formData.test_date) : null} onChange={(date) => setFormData({ ...formData, test_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select date" />'
    },
    {
        file: 'src/app/teacher/tests/page.tsx',
        search: '<input type="date" className="input-field" value={formData.test_date} onChange={e => setFormData(p => ({ ...p, test_date: e.target.value }))} />',
        replace: '<DatePicker selected={formData.test_date ? new Date(formData.test_date) : null} onChange={(date) => setFormData((p) => ({ ...p, test_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" }))} dateFormat="MMMM d, yyyy" placeholderText="Select date" />'
    },
    {
        file: 'src/app/teacher/homework/page.tsx',
        search: '<input type="date" required className="input-field" value={formData.assigned_date} onChange={e => setFormData({ ...formData, assigned_date: e.target.value })} />',
        replace: '<DatePicker selected={formData.assigned_date ? new Date(formData.assigned_date) : null} onChange={(date) => setFormData({ ...formData, assigned_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select assigned date" />'
    },
    {
        file: 'src/app/teacher/homework/page.tsx',
        search: '<input type="date" required className="input-field" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />',
        replace: '<DatePicker selected={formData.due_date ? new Date(formData.due_date) : null} onChange={(date) => setFormData({ ...formData, due_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select due date" />'
    },
    {
        file: 'src/app/teacher/enquiries/page.tsx',
        search: '<input type="date" className="input-field" value={formData.demo_date} onChange={(e) => setFormData(p => ({ ...p, demo_date: e.target.value }))} />',
        replace: '<DatePicker selected={formData.demo_date ? new Date(formData.demo_date) : null} onChange={(date) => setFormData((p) => ({ ...p, demo_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" }))} dateFormat="MMMM d, yyyy" placeholderText="Select demo date" />'
    },
    {
        file: 'src/app/teacher/enquiries/page.tsx',
        search: '<input type="time" className="input-field" value={formData.demo_time} onChange={(e) => setFormData(p => ({ ...p, demo_time: e.target.value }))} />',
        replace: '<DatePicker selected={formData.demo_time ? new Date(\1970-01-01T\:00\) : null} onChange={(date) => setFormData((p) => ({ ...p, demo_time: date ? date.toTimeString().slice(0, 5) : \\"\\" }))} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa" placeholderText="Select time" />'
    },
    {
        file: 'src/app/admin/students/page.tsx',
        search: <input type="date" required style={{ padding: '10px 14px', border: '1px solid #F0F0F5', borderRadius: '10px', fontSize: '14px', background: '#F8F9FD', width: '100%', outline: 'none' }} value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} />,
        replace: '<DatePicker selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null} onChange={(date) => setFormData({ ...formData, date_of_birth: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select date of birth" />'
    },
    {
        file: 'src/app/admin/homework/page.tsx',
        search: '<input type="date" required style={inputStyle} value={formData.assigned_date} onChange={e => setFormData({ ...formData, assigned_date: e.target.value })} />',
        replace: '<DatePicker selected={formData.assigned_date ? new Date(formData.assigned_date) : null} onChange={(date) => setFormData({ ...formData, assigned_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select assigned date" />'
    },
    {
        file: 'src/app/admin/homework/page.tsx',
        search: '<input type="date" required style={inputStyle} value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />',
        replace: '<DatePicker selected={formData.due_date ? new Date(formData.due_date) : null} onChange={(date) => setFormData({ ...formData, due_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select due date" />'
    },
    {
        file: 'src/app/admin/fees/page.tsx',
        search: '<input type="date" required className="input-field" value={assignFormData.due_date} onChange={e => setAssignFormData({ ...assignFormData, due_date: e.target.value })} />',
        replace: '<DatePicker selected={assignFormData.due_date ? new Date(assignFormData.due_date) : null} onChange={(date) => setAssignFormData({ ...assignFormData, due_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" })} dateFormat="MMMM d, yyyy" placeholderText="Select due date" />'
    },
    {
        file: 'src/app/admin/enquiries/page.tsx',
        search: '<input type="date" className="input-field" value={formData.demo_date} onChange={(e) => setFormData(p => ({ ...p, demo_date: e.target.value }))} />',
        replace: '<DatePicker selected={formData.demo_date ? new Date(formData.demo_date) : null} onChange={(date) => setFormData((p) => ({ ...p, demo_date: date ? date.toISOString().split(\\"T\\")[0] : \\"\\" }))} dateFormat="MMMM d, yyyy" placeholderText="Select demo date" />'
    },
    {
        file: 'src/app/admin/enquiries/page.tsx',
        search: '<input type="time" className="input-field" value={formData.demo_time} onChange={(e) => setFormData(p => ({ ...p, demo_time: e.target.value }))} />',
        replace: '<DatePicker selected={formData.demo_time ? new Date(\1970-01-01T\:00\) : null} onChange={(date) => setFormData((p) => ({ ...p, demo_time: date ? date.toTimeString().slice(0, 5) : \\"\\" }))} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa" placeholderText="Select time" />'
    }
];

let filesModified = new Set();
edits.forEach(edit => {
    let content = fs.readFileSync(edit.file, 'utf8');
    if (content.includes(edit.search)) {
        content = content.replace(edit.search, edit.replace);
        if (!content.includes("import DatePicker from 'react-datepicker';")) {
            content = content.replace(/(import.*?;?\\n)/, "\\ DatePicker from 'react-datepicker';\\nimport 'react-datepicker/dist/react-datepicker.css';\\n");
        }
        fs.writeFileSync(edit.file, content, 'utf8');
        filesModified.add(edit.file);
        console.log(\Updated \\);
    } else {
        console.log(\Could not find match in \\);
    }
});

const fs = require('fs');

// ----- FIX ADMIN -----
const adminPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/admin/students/[id]/page.tsx';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Fix 1: Add MessageSquare to imports
adminContent = adminContent.replace('ShieldCheck, Trophy\n} from \'lucide-react\';', 'ShieldCheck, Trophy, MessageSquare\n} from \'lucide-react\';');

// Fix 2: Add queriesRes to Promise.allSettled
adminContent = adminContent.replace(
    'const [attRes, testRes, feeRes, perfRes, hwRes] = await Promise.allSettled([\n                api.get(`/students/${params.id}/attendance`),\n                api.get(`/students/${params.id}/tests`),\n                api.get(`/students/${params.id}/fees`),\n                api.get(`/students/${params.id}/performance`),\n                api.get(`/students/${params.id}/homework-history`)\n            ]);',
    'const [attRes, testRes, feeRes, perfRes, hwRes, queriesRes] = await Promise.allSettled([\n                api.get(`/students/${params.id}/attendance`),\n                api.get(`/students/${params.id}/tests`),\n                api.get(`/students/${params.id}/fees`),\n                api.get(`/students/${params.id}/performance`),\n                api.get(`/students/${params.id}/homework-history`),\n                api.get(`/queries`, { params: { student_id: params.id } })\n            ]);'
);

fs.writeFileSync(adminPath, adminContent);

// ----- FIX TEACHER -----
const teacherPath = 'c:/Users/Aryan/Desktop/CLIENTS/Proton_SMS/frontend/src/app/teacher/students/[id]/page.tsx';
let teacherContent = fs.readFileSync(teacherPath, 'utf8');

// Fix 1: Add setQueries state
if (!teacherContent.includes('const [queries, setQueries]')) {
    teacherContent = teacherContent.replace(
        'const [homeworkHistory, setHomeworkHistory] = useState<any[]>([]);',
        'const [homeworkHistory, setHomeworkHistory] = useState<any[]>([]);\n    const [queries, setQueries] = useState<any[]>([]);'
    );
}

// Fix 2: Add queriesRes to Promise.allSettled
teacherContent = teacherContent.replace(
    'const [attRes, testRes, perfRes, hwRes, remarksRes] = await Promise.allSettled([\n            api.get(`/students/${params.id}/attendance`),\n            api.get(`/students/${params.id}/tests`),\n            api.get(`/students/${params.id}/performance`),\n            api.get(`/students/${params.id}/homework-history`),\n            api.get(`/students/${params.id}/remarks`)\n        ]);',
    'const [attRes, testRes, perfRes, hwRes, remarksRes, queriesRes] = await Promise.allSettled([\n            api.get(`/students/${params.id}/attendance`),\n            api.get(`/students/${params.id}/tests`),\n            api.get(`/students/${params.id}/performance`),\n            api.get(`/students/${params.id}/homework-history`),\n            api.get(`/students/${params.id}/remarks`),\n            api.get(`/queries`, { params: { student_id: params.id } })\n        ]);'
);

fs.writeFileSync(teacherPath, teacherContent);
console.log('Fixes applied successfully.');

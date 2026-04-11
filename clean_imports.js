const fs = require('fs');

const files = [
    "admin/tests", "admin/homework", "admin/demos", "admin/queries", "admin/permissions",
    "teacher/tests", "teacher/homework", "teacher/demos", "teacher/queries", "teacher/reports",
    "student/tests", "student/homework", "student/queries", "student/video-lectures",
    "parent/tests", "parent/notifications"
].map(f => `frontend/src/app/${f}/page.tsx`);

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let lines = content.split('\n');
        let hasImport = false;
        let newLines = [];
        
        for (let line of lines) {
            // Trim carriage returns on windows
            let cleanLine = line.replace('\r', '');
            if (cleanLine === "import ToolBottomBar from '@/components/ToolBottomBar';") {
                if (!hasImport) {
                    newLines.push(line);
                    hasImport = true;
                }
            } else {
                newLines.push(line);
            }
        }
        
        fs.writeFileSync(file, newLines.join('\n'));
        console.log('Cleaned ' + file);
    }
});

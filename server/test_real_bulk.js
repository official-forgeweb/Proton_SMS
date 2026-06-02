const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { ensureSubjectExists } = require('./src/utils/normalization');

const bulkClassesPayload = [
  { className: 'Class 12', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts'] },
  { className: 'Class 12 + Competition', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts', 'Competition Preparation'] },
  { className: 'Class 11', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts'] },
  { className: 'Class 11 + Competition', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts', 'Competition Preparation'] },
  { className: 'Class 10', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
  { className: 'Class 10 Advanced', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Advanced Mathematics', 'Advanced Science'] },
  { className: 'Class 9', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
  { className: 'Class 9 Advanced', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Advanced Mathematics', 'Advanced Science'] },
  { className: 'Class 8 CBSE', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science'] },
  { className: 'Class 8 CBSE Advanced', subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer Science', 'Advanced Mathematics', 'Advanced Science'] }
];

async function main() {
  try {
    const createdClasses = [];
    const skippedClasses = [];

    // Fetch existing classes
    const existingClasses = await prisma.class.findMany({ select: { class_name: true } });
    const existingClassNames = new Set(existingClasses.map(c => c.class_name.toLowerCase().trim()));

    const classesToCreate = bulkClassesPayload.filter(c => {
      const nameNorm = c.className.toLowerCase().trim();
      if (existingClassNames.has(nameNorm)) {
        skippedClasses.push(c.className);
        return false;
      }
      return true;
    });

    console.log('Classes to create count:', classesToCreate.length);

    const result = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const item of classesToCreate) {
        const className = item.className;
        const subjects = item.subjects;

        const canonicalSubjects = [];
        if (subjects && Array.isArray(subjects)) {
          for (const sub of subjects) {
            console.log(`Normalizing subject: "${sub}"`);
            const resolved = await ensureSubjectExists(sub);
            if (resolved) {
              canonicalSubjects.push(resolved);
            }
          }
        }

        let classCode = '';
        let isCodeUnique = false;
        while (!isCodeUnique) {
          const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
          classCode = `CLS2026${rand}`;
          const existingCode = await tx.class.findUnique({ where: { class_code: classCode } });
          if (!existingCode) {
            isCodeUnique = true;
          }
        }

        const newClass = await tx.class.create({
          data: {
            class_code: classCode,
            class_name: className,
            grade_level: className.includes('12') ? 'Grade 12' : className.includes('11') ? 'Grade 11' : className.includes('10') ? 'Grade 10' : className.includes('9') ? 'Grade 9' : className.includes('8') ? 'Grade 8' : 'Secondary',
            academic_year: '2026-2027',
            batch_type: className.includes('Competition') ? 'competition' : 'regular',
            status: 'ongoing',
            current_students_count: 0,
            max_students: 40,
            course_duration_months: 12,
            course_fee: className.includes('Competition') ? 45000 : 35000,
          }
        });

        if (canonicalSubjects.length > 0) {
          await tx.classSchedule.createMany({
            data: canonicalSubjects.map((subjectName) => ({
              class_id: newClass.id,
              subject: subjectName,
              teacher_id: null,
              time_start: '09:00',
              time_end: '10:00',
              days: ['Monday', 'Wednesday', 'Friday']
            }))
          });
        }

        createdClasses.push(className);
        createdResults.push(newClass);
      }
      return createdResults;
    });

    console.log('SUCCESS TRANSACTION:', createdClasses);
  } catch (error) {
    console.error('TRANSACTION ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

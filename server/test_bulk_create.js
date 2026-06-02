const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bulkClassesPayload = [
    { className: 'Class 12', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Economics', 'Accounts'] }
];

async function main() {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdResults = [];

      for (const item of bulkClassesPayload) {
        const className = item.className;
        const subjects = item.subjects;

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
            grade_level: 'Grade 12',
            academic_year: '2026-2027',
            batch_type: 'regular',
            status: 'ongoing',
            current_students_count: 0,
            max_students: 40,
            course_duration_months: 12,
            course_fee: 35000,
          }
        });

        console.log('Class created:', newClass.id);

        if (subjects && subjects.length > 0) {
          const scheduleData = subjects.map((subjectName) => ({
            class_id: newClass.id,
            subject: subjectName,
            teacher_id: null,
            time_start: '09:00',
            time_end: '10:00',
            days: ['Monday', 'Wednesday', 'Friday']
          }));
          
          console.log('Schedule data to insert:', scheduleData);

          await tx.classSchedule.createMany({
            data: scheduleData
          });
        }
        createdResults.push(newClass);
      }
      return createdResults;
    });

    console.log('SUCCESS:', result);
  } catch (error) {
    console.error('TRANSACTION ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

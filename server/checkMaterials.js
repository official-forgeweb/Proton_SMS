const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const materials = await prisma.studyMaterial.findMany({ include: { class_ref: true } });
    console.log('Materials:', JSON.stringify(materials, null, 2));
    
    // Simulate student request for user ad621d66-127f-46f9-a9a6-c297841ed2e5
    // Wait, let's just get the first active student
    const student = await prisma.student.findFirst({
        where: { academic_status: 'active' },
        include: { class_enrollments: true, subject_enrollments: true }
    });
    console.log('\nStudent subject enrollments:', JSON.stringify(student.subject_enrollments, null, 2));

    const classIds = student.class_enrollments.map(e => e.class_id);
    const subjectsByClass = {};
    student.subject_enrollments.forEach(e => {
        if (!subjectsByClass[e.class_id]) subjectsByClass[e.class_id] = [];
        subjectsByClass[e.class_id].push(e.subject);
    });

    const orConditions = classIds.map(cid => {
        const subjects = subjectsByClass[cid];
        if (subjects && subjects.length > 0) {
            return { 
                class_id: cid, 
                OR: subjects.map(s => ({
                    subject: { equals: s.trim(), mode: 'insensitive' }
                }))
            };
        }
        return { class_id: cid };
    });

    let filters = { status: 'active' };
    filters.OR = orConditions;
    
    console.log('\nFilters:', JSON.stringify(filters, null, 2));
    
    const matched = await prisma.studyMaterial.findMany({ where: filters });
    console.log('\nMatched for student:', JSON.stringify(matched, null, 2));
}
main().finally(() => prisma.$disconnect());

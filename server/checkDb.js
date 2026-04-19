const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const students = await prisma.student.findMany({
        where: { user: { role: 'student' } },
        include: { subject_enrollments: true, class_enrollments: true }
    });
    console.log('Students:', JSON.stringify(students.slice(0, 2), null, 2));
    
    const videos = await prisma.videoLecture.findMany({
        select: { subject: true, title: true, class_id: true }
    });
    console.log('\nVideos:', JSON.stringify(videos, null, 2));
}
main().finally(() => prisma.$disconnect());

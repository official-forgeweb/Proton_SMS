const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const enrollments = await prisma.studentSubjectEnrollment.findMany();
    console.log('Subject Enrollments:', JSON.stringify(enrollments, null, 2));
}
main().finally(() => prisma.$disconnect());

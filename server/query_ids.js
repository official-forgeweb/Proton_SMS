const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const students = await prisma.student.findMany({
        select: { id: true, first_name: true, last_name: true, PRO_ID: true }
    });
    console.log('Students in database count:', students.length);
    console.log('Students:', JSON.stringify(students, null, 2));
}
main().finally(() => prisma.$disconnect());

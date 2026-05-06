import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanParents() {
    try {
        console.log('Cleaning up parent mappings...');
        // @ts-ignore
        await prisma.parentStudentMapping.deleteMany({});
        console.log('Cleaning up parents...');
        // @ts-ignore
        await prisma.parent.deleteMany({});
        console.log('Cleaning up parent users...');
        // @ts-ignore
        await prisma.$executeRaw`DELETE FROM "users" WHERE "role" = 'parent'`;
        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanParents();

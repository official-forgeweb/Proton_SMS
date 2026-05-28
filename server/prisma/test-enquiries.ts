import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.enquiry.count();
    console.log('Total enquiries in database:', count);
    
    const enquiries = await prisma.enquiry.findMany();
    console.log('Enquiries list:', JSON.stringify(enquiries, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

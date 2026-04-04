import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Indian dummy data...');

  // Create Indian Students
  const studentsData = [
    { first: 'Aarav', last: 'Sharma', phone: '9876543210', gender: 'Male' },
    { first: 'Vihaan', last: 'Patel', phone: '9876543211', gender: 'Male' },
    { first: 'Aditi', last: 'Rao', phone: '9876543212', gender: 'Female' },
    { first: 'Diya', last: 'Singh', phone: '9876543213', gender: 'Female' },
    { first: 'Rohan', last: 'Verma', phone: '9876543214', gender: 'Male' },
    { first: 'Kavya', last: 'Desai', phone: '9876543215', gender: 'Female' },
    { first: 'Arjun', last: 'Reddy', phone: '9876543216', gender: 'Male' },
    { first: 'Neha', last: 'Gupta', phone: '9876543217', gender: 'Female' }
  ];

  const defaultPassword = await bcrypt.hash('password123', 10);
  
  const createdStudents = [];
  for (const [i, s] of studentsData.entries()) {
    // skip if student email exists
    let user = await prisma.user.findUnique({ where: { email: `student${i + 1}@proton.com` }});
    if (!user) {
        user = await prisma.user.create({
        data: {
            email: `student${i + 1}@proton.com`,
            password_hash: defaultPassword,
            role: 'student',
            is_active: true
        }
        });

        const student = await prisma.student.create({
        data: {
            user_id: user.id,
            PRO_ID: `PRO2026${String((Math.random()*1000).toFixed(0)).padStart(3, '0')}${i}`,
            first_name: s.first,
            last_name: s.last,
            gender: s.gender,
            phone: s.phone,
            email: user.email,
            academic_status: 'active',
            enrollment_date: new Date().toISOString()
        }
        });
        createdStudents.push(student);
    }
  }

  // Find a class to assign them to
  const classes = await prisma.class.findMany();
  let mainClass = classes[0];
  
  if (!mainClass) {
    mainClass = await prisma.class.create({
        data: {
            class_code: `CLS${Math.floor(Math.random()*10000)}`,
            class_name: 'JEE Mains Aspirants',
            batch_type: 'regular',
            status: 'ongoing'
        }
    });
  }

  // Enroll students
  for (const student of createdStudents) {
    await prisma.studentClassEnrollment.create({
        data: {
            student_id: student.id,
            class_id: mainClass.id,
            enrollment_status: 'active',
            enrollment_date: new Date().toISOString()
        }
    });
  }

  // Dummy Attendance
  const today = new Date().toISOString().split('T')[0];
  let p = 0;
  for (const student of createdStudents) {
    await prisma.attendance.create({
        data: {
            student_id: student.id,
            class_id: mainClass.id,
            attendance_date: today,
            status: p++ % 5 === 0 ? 'absent' : 'present'
        }
    });
  }

  // Create Enquiries
  const enquiries = [
    { name: 'Karan Malhotra', course: 'NEET Foundation' },
    { name: 'Riya Kapoor', course: 'JEE Advanced' }
  ];

  for (const [i, e] of enquiries.entries()) {
    await prisma.enquiry.create({
        data: {
            enquiry_number: `ENQ${Math.floor(Math.random() * 10000)}`,
            student_name: e.name,
            phone: '9988776655',
            interested_course: e.course,
            status: 'new'
        }
    });
  }

  // Create Homework
  try {
      await prisma.homework.create({
          data: {
              class_id: mainClass.id,
              title: 'Physics Kinematics Problems',
              description: 'Solve the first 20 problems from chapter 3.',
              assigned_date: today,
              status: 'active'
          }
      });
  } catch (e) {
      console.error(e)
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

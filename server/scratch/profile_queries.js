const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runProfile() {
  console.log('Starting Profiling of Dashboard Queries...');

  // Helper function to profile a single query
  async function profile(name, fn) {
    const start = Date.now();
    try {
      await fn();
      console.log(`✅ ${name}: ${Date.now() - start}ms`);
    } catch (err) {
      console.error(`❌ ${name} failed:`, err.message);
    }
  }

  // 1. SELECT 1 (Simple Ping)
  await profile('Simple Ping (SELECT 1)', () => prisma.$queryRaw`SELECT 1`);

  // 2. Gender Group By
  await profile('Gender Group By', () => prisma.student.groupBy({ by: ['gender'], _count: true }));

  // 3. Top Students
  await profile('Top Students', () => prisma.testResult.findMany({
    orderBy: { percentage: 'desc' },
    take: 5,
    include: { student: { select: { first_name: true, last_name: true, PRO_ID: true } } },
  }));

  // 4. Fee Payments
  await profile('Fee Payments', () => prisma.feePayment.findMany({
    where: { payment_status: 'completed', created_at: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    select: { amount_paid: true, payment_date: true, created_at: true },
  }));

  // 5. All Students created_at
  await profile('All Students created_at', () => prisma.student.findMany({
    select: { created_at: true },
  }));

  // 6. All Enquiries created_at
  await profile('All Enquiries created_at', () => prisma.enquiry.findMany({
    where: { created_at: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    select: { created_at: true },
  }));

  // 7. Monthly Performance Raw SQL
  await profile('Monthly Performance Raw SQL', () => prisma.$queryRaw`
    SELECT EXTRACT(MONTH FROM created_at) as month, AVG(percentage) as "avgScore"
    FROM test_results
    WHERE created_at IS NOT NULL
    GROUP BY EXTRACT(MONTH FROM created_at)
    ORDER BY month
  `);

  // 8. Monthly Attendance Raw SQL
  await profile('Monthly Attendance Raw SQL', () => prisma.$queryRaw`
    SELECT
      EXTRACT(MONTH FROM TO_DATE(attendance_date, 'YYYY-MM-DD')) as month,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as "presentCount",
      COUNT(*) as "totalCount"
    FROM attendance
    WHERE attendance_date IS NOT NULL AND attendance_date != ''
    GROUP BY EXTRACT(MONTH FROM TO_DATE(attendance_date, 'YYYY-MM-DD'))
    ORDER BY month
  `);

  // 9. Alerts queries (combined counts & aggregates)
  await profile('Alerts - count pending demos', () => prisma.demoClass.count({ where: { status: { not: 'completed' } } }));
  await profile('Alerts - aggregate fees pending', () => prisma.studentFeeAssignment.aggregate({ _sum: { total_pending: true } }));
  await profile('Alerts - low attendance active enrollments', () => prisma.studentClassEnrollment.findMany({
    where: {
        enrollment_status: 'active',
        overall_attendance_percentage: { lt: 60, gt: 0 }
    },
    include: {
        student: { select: { first_name: true, last_name: true, PRO_ID: true } },
        class: { select: { class_name: true, class_code: true } }
    },
    orderBy: { overall_attendance_percentage: 'asc' },
    take: 3
  }));
}

runProfile()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('Profile run error:', err);
    prisma.$disconnect();
  });

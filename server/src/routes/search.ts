import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/search - Global search endpoint
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    const role = req.user!.role;

    if (!q) {
      res.json({ success: true, data: [] });
      return;
    }

    const results: any[] = [];

    if (role === 'admin') {
      // Admin searches for Students, Teachers, Classes, Enquiries, Queries
      const [students, teachers, classes, enquiries, queries] = await Promise.all([
        prisma.student.findMany({
          where: {
            OR: [
              { first_name: { contains: q, mode: 'insensitive' } },
              { last_name: { contains: q, mode: 'insensitive' } },
              { PRO_ID: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.teacher.findMany({
          where: {
            OR: [
              { first_name: { contains: q, mode: 'insensitive' } },
              { last_name: { contains: q, mode: 'insensitive' } },
              { employee_id: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.class.findMany({
          where: {
            OR: [
              { class_name: { contains: q, mode: 'insensitive' } },
              { class_code: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.enquiry.findMany({
          where: {
            OR: [
              { student_name: { contains: q, mode: 'insensitive' } },
              { enquiry_number: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.studentQuery.findMany({
          where: {
            OR: [
              { query_number: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        })
      ]);

      students.forEach(s => results.push({
        title: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        subtitle: `Student ID: ${s.PRO_ID || 'N/A'}`,
        type: 'student',
        href: `/admin/students`
      }));

      teachers.forEach(t => results.push({
        title: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
        subtitle: `Teacher ID: ${t.employee_id || 'N/A'}`,
        type: 'teacher',
        href: `/admin/teachers`
      }));

      classes.forEach(c => results.push({
        title: c.class_name || 'Class',
        subtitle: `Code: ${c.class_code}`,
        type: 'class',
        href: `/admin/classes`
      }));

      enquiries.forEach(e => results.push({
        title: e.student_name || 'Enquiry',
        subtitle: `Enquiry No: ${e.enquiry_number}`,
        type: 'enquiry',
        href: `/admin/enquiries`
      }));

      queries.forEach(q => results.push({
        title: `Query: ${q.query_number}`,
        subtitle: q.description || '',
        type: 'query',
        href: `/admin/queries`
      }));

    } else if (role === 'teacher') {
      // Teacher searches for Students, Classes, Homework, Tests, Queries
      const [students, classes, homeworks, tests, queries] = await Promise.all([
        prisma.student.findMany({
          where: {
            OR: [
              { first_name: { contains: q, mode: 'insensitive' } },
              { last_name: { contains: q, mode: 'insensitive' } },
              { PRO_ID: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.class.findMany({
          where: {
            OR: [
              { class_name: { contains: q, mode: 'insensitive' } },
              { class_code: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.homework.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.test.findMany({
          where: {
            OR: [
              { test_name: { contains: q, mode: 'insensitive' } },
              { test_code: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.studentQuery.findMany({
          where: {
            OR: [
              { query_number: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        })
      ]);

      students.forEach(s => results.push({
        title: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        subtitle: `Student ID: ${s.PRO_ID || 'N/A'}`,
        type: 'student',
        href: `/teacher/students`
      }));

      classes.forEach(c => results.push({
        title: c.class_name || 'Class',
        subtitle: `Code: ${c.class_code}`,
        type: 'class',
        href: `/teacher/attendance`
      }));

      homeworks.forEach(h => results.push({
        title: h.title || 'Homework',
        subtitle: h.description || '',
        type: 'homework',
        href: `/teacher/homework`
      }));

      tests.forEach(t => results.push({
        title: t.test_name || 'Test',
        subtitle: `Code: ${t.test_code}`,
        type: 'test',
        href: `/teacher/tests`
      }));

      queries.forEach(q => results.push({
        title: `Query: ${q.query_number}`,
        subtitle: q.description || '',
        type: 'query',
        href: `/teacher/queries`
      }));

    } else if (role === 'student') {
      // Student searches for Homework, Tests, Study Materials
      const [homeworks, tests, materials] = await Promise.all([
        prisma.homework.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.test.findMany({
          where: {
            OR: [
              { test_name: { contains: q, mode: 'insensitive' } },
              { test_code: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.studyMaterial.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { subject: { contains: q, mode: 'insensitive' } }
            ]
          },
          take: 5
        })
      ]);

      homeworks.forEach(h => results.push({
        title: h.title || 'Homework',
        subtitle: h.description || '',
        type: 'homework',
        href: `/student/homework`
      }));

      tests.forEach(t => results.push({
        title: t.test_name || 'Test',
        subtitle: `Code: ${t.test_code}`,
        type: 'test',
        href: `/student/tests`
      }));

      materials.forEach(m => results.push({
        title: m.title || 'Material',
        subtitle: m.subject || '',
        type: 'material',
        href: `/student/materials`
      }));
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const cache_1 = require("../middleware/cache");
const sendMail_1 = require("../services/mail/sendMail");
const router = (0, express_1.Router)();
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const generateProId = () => `PRO${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const paramId = (req) => String(req.params.id);
// GET /api/students
router.get('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), (0, cache_1.cacheMiddleware)(10), async (req, res) => {
    try {
        const { search, status, class_id, subject, fee_status, global_search, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        let where = {};
        if (req.user.role === 'teacher' && global_search !== 'true') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id }, select: { id: true } });
            if (teacher) {
                const myClasses = await database_1.default.class.findMany({
                    where: {
                        OR: [
                            { primary_teacher_id: teacher.id },
                            { schedule: { some: { teacher_id: teacher.id } } }
                        ]
                    },
                    select: { id: true },
                });
                const classIds = myClasses.map(c => c.id);
                if (class_id && isUUID(class_id)) {
                    if (!classIds.includes(class_id)) {
                        res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: limitNum, pages: 0 } });
                        return;
                    }
                }
                else {
                    const enrollments = await database_1.default.studentClassEnrollment.findMany({
                        where: { class_id: { in: classIds } },
                        select: { student_id: true },
                    });
                    const studentIds = enrollments.map(e => e.student_id);
                    where.id = { in: studentIds };
                }
            }
        }
        if (search) {
            where.OR = [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { PRO_ID: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.academic_status = status;
        // Filter by subject within a batch
        if (class_id && subject) {
            const subjectEnrollments = await database_1.default.studentSubjectEnrollment.findMany({
                where: { class_id, subject, status: 'active' },
                select: { student_id: true },
            });
            const studentIds = subjectEnrollments.map(e => e.student_id);
            where.id = where.id ? { in: (where.id.in || []).filter((id) => studentIds.includes(id)) } : { in: studentIds };
        }
        else if (class_id) {
            const enrollments = await database_1.default.studentClassEnrollment.findMany({
                where: { class_id, enrollment_status: 'active' },
                select: { student_id: true },
            });
            const studentIds = enrollments.map(e => e.student_id);
            where.id = where.id ? { in: (where.id.in || []).filter((id) => studentIds.includes(id)) } : { in: studentIds };
        }
        // Run count + data fetch in PARALLEL with included relations (reduces DB round-trips from 5 to 2)
        const skip = (pageNum - 1) * limitNum;
        const [total, students] = await Promise.all([
            database_1.default.student.count({ where }),
            database_1.default.student.findMany({
                where,
                skip,
                take: limitNum,
                select: {
                    id: true, PRO_ID: true, first_name: true, last_name: true,
                    email: true, phone: true, gender: true, academic_status: true,
                    fee_assignments: {
                        take: 1,
                        select: { payment_status: true, final_fee: true, total_paid: true },
                    },
                    class_enrollments: {
                        where: { enrollment_status: 'active' },
                        select: {
                            overall_attendance_percentage: true,
                            class: { select: { id: true, class_name: true, class_code: true } },
                        },
                    },
                    subject_enrollments: {
                        where: { status: 'active' },
                        select: { subject: true, class_id: true, status: true },
                    },
                    test_results: {
                        select: { percentage: true },
                    },
                    created_at: true,
                },
            }),
        ]);
        let enrichedStudents = students.map(s => ({
            id: s.id, PRO_ID: s.PRO_ID, first_name: s.first_name, last_name: s.last_name,
            email: s.email, phone: s.phone, gender: s.gender, academic_status: s.academic_status,
            fee_status: s.fee_assignments[0]?.payment_status || 'pending',
            total_fee: s.fee_assignments[0]?.final_fee || 0,
            total_paid: s.fee_assignments[0]?.total_paid || 0,
            classes: s.class_enrollments.map((e) => ({
                id: e.class?.id, name: e.class?.class_name, code: e.class?.class_code,
            })),
            subjects: s.subject_enrollments.map((se) => ({
                subject: se.subject, class_id: se.class_id, status: se.status,
            })),
            attendance_percentage: s.class_enrollments[0]?.overall_attendance_percentage || 0,
            avg_marks: s.test_results && s.test_results.length > 0
                ? Math.round(s.test_results.reduce((acc, r) => acc + (r.percentage || 0), 0) / s.test_results.length)
                : 0,
            join_date: s.created_at,
        }));
        if (fee_status)
            enrichedStudents = enrichedStudents.filter(s => s.fee_status === fee_status);
        res.json({
            success: true,
            data: enrichedStudents,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/stats
router.get('/stats', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), (0, cache_1.cacheMiddleware)(30), async (req, res) => {
    try {
        const [total, active, maleCount, femaleCount, feeAgg] = await Promise.all([
            database_1.default.student.count(),
            database_1.default.student.count({ where: { academic_status: 'active' } }),
            database_1.default.student.count({ where: { gender: 'male' } }),
            database_1.default.student.count({ where: { gender: 'female' } }),
            database_1.default.studentFeeAssignment.groupBy({
                by: ['payment_status'],
                _count: true,
                _sum: { total_paid: true, total_pending: true },
            }),
        ]);
        const inactive = total - active;
        let fully_paid = 0, partial = 0, pending = 0, overdue = 0, totalPaid = 0, totalPending = 0;
        feeAgg.forEach(g => {
            if (g.payment_status === 'paid')
                fully_paid = g._count;
            if (g.payment_status === 'partial')
                partial = g._count;
            if (g.payment_status === 'pending')
                pending = g._count;
            if (g.payment_status === 'overdue')
                overdue = g._count;
            totalPaid += g._sum.total_paid || 0;
            totalPending += g._sum.total_pending || 0;
        });
        res.json({
            success: true,
            data: {
                total, active, inactive,
                gender: { male: maleCount, female: femaleCount },
                fee: { fully_paid, partial, pending, overdue },
                revenue: { total: totalPaid, pending: totalPending },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const student = isUUID(id)
            ? await database_1.default.student.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const [enrollments, subjectEnrollments, feeAssignment, payments, recentTests] = await Promise.all([
            database_1.default.studentClassEnrollment.findMany({
                where: { student_id: student.id },
                include: { class: { include: { schedule: true } } },
            }),
            database_1.default.studentSubjectEnrollment.findMany({
                where: { student_id: student.id, status: 'active' },
            }),
            database_1.default.studentFeeAssignment.findFirst({ where: { student_id: student.id } }),
            database_1.default.feePayment.findMany({ where: { student_id: student.id } }),
            database_1.default.testResult.findMany({
                where: { student_id: student.id },
                orderBy: { created_at: 'desc' },
                take: 5,
                include: { test: true },
            }),
        ]);
        res.json({
            success: true,
            data: {
                ...student,
                id: student.id,
                classes: enrollments.map((e) => ({
                    ...e.class,
                    enrollment: { ...e, class_id: e.class_id },
                })),
                subject_enrollments: subjectEnrollments,
                fee: feeAssignment,
                payments,
                recent_tests: recentTests.map((tr) => ({ ...tr, test: tr.test })),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/students/bulk - Bulk import students
router.post('/bulk', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const { students } = req.body;
        if (!students || !Array.isArray(students)) {
            res.status(400).json({ success: false, message: 'Students array is required' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        let created = 0;
        const errors = [];
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            try {
                const { first_name, last_name, date_of_birth, gender, email, phone, school_name, class_id, admission_type } = student;
                if (!first_name || !phone) {
                    errors.push(`Row ${i + 1}: Missing required fields (first_name or phone)`);
                    continue;
                }
                const fName = (first_name || 'student').toLowerCase();
                const lName = (last_name || '').toLowerCase();
                const userEmail = email || `${fName}.${lName}.${Math.floor(Math.random() * 10000)}@proton.com`;
                const existingEmail = await database_1.default.user.findUnique({ where: { email: userEmail } });
                if (existingEmail) {
                    errors.push(`Row ${i + 1}: Email already exists - ${userEmail}`);
                    continue;
                }
                const tempPassword = `Proton@${Math.floor(1000 + Math.random() * 9000)}`;
                const user = await database_1.default.user.create({
                    data: {
                        email: userEmail,
                        password_hash: await bcryptjs_1.default.hash(tempPassword, salt),
                        role: 'student',
                    },
                });
                const proId = generateProId();
                const newStudent = await database_1.default.student.create({
                    data: {
                        user_id: user.id,
                        PRO_ID: proId,
                        first_name,
                        last_name,
                        date_of_birth: date_of_birth || null,
                        gender: gender || 'male',
                        email,
                        phone,
                        school_name,
                        enrollment_date: new Date().toISOString(),
                        enrollment_number: `ENR${proId}`,
                        admission_type: admission_type || 'fresh',
                    },
                });
                // Notify new student of welcome onboarding details
                sendMail_1.mailEventEmitter.emit('student.created', {
                    name: `${first_name || ''} ${last_name || ''}`.trim(),
                    email: newStudent.email || userEmail,
                    proId: newStudent.PRO_ID,
                    tempPass: tempPassword,
                });
                if (class_id) {
                    await database_1.default.studentClassEnrollment.create({
                        data: {
                            student_id: newStudent.id,
                            class_id,
                            enrollment_date: new Date().toISOString(),
                        },
                    });
                    await database_1.default.class.update({
                        where: { id: class_id },
                        data: { current_students_count: { increment: 1 } },
                    });
                }
                created++;
            }
            catch (err) {
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }
        (0, cache_1.invalidateCache)('/api/students');
        res.status(201).json({
            success: true,
            data: { created, failed: students.length - created, errors },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
// POST /api/students
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const { first_name, last_name, date_of_birth, gender, email, phone, school_name, class_id, admission_type } = req.body;
        // Check if email already exists
        if (email) {
            const existingUser = await database_1.default.user.findUnique({ where: { email } });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        let password = `Proton@${Math.floor(1000 + Math.random() * 9000)}`;
        if (date_of_birth) {
            const parts = date_of_birth.split('-');
            if (parts.length === 3) {
                const year = parts[0].substring(2, 4);
                const month = parts[1];
                const day = parts[2];
                password = `${day}${month}${year}`;
            }
        }
        const fName = (first_name || 'student').toLowerCase().replace(/\s+/g, '');
        const lName = (last_name || '').toLowerCase().replace(/\s+/g, '');
        const userEmail = email || `${fName}.${lName}.${Math.floor(Math.random() * 10000)}@proton.com`;
        // Final check for generated email too
        const existingGenerated = await database_1.default.user.findUnique({ where: { email: userEmail } });
        if (existingGenerated) {
            res.status(400).json({ success: false, message: 'Generated email collision. Please try again or provide a manual email.' });
            return;
        }
        const user = await database_1.default.user.create({
            data: {
                email: userEmail,
                password_hash: await bcryptjs_1.default.hash(password, salt),
                role: 'student',
            },
        });
        // Generate a unique PRO_ID
        let proId = generateProId();
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            const existing = await database_1.default.student.findUnique({ where: { PRO_ID: proId } });
            if (existing) {
                proId = generateProId();
                attempts++;
            }
            else {
                isUnique = true;
            }
        }
        const student = await database_1.default.student.create({
            data: {
                user_id: user.id,
                PRO_ID: proId,
                first_name,
                last_name,
                date_of_birth,
                gender,
                email,
                phone,
                school_name,
                enrollment_date: new Date().toISOString(),
                enrollment_number: `ENR${proId}`,
                admission_type: admission_type || 'fresh',
            },
        });
        // Enroll in subjects if subjects array provided (per class)
        const { subjects, class_ids } = req.body;
        // Support both single class_id and multiple class_ids
        const allClassIds = [];
        if (class_ids && Array.isArray(class_ids)) {
            allClassIds.push(...class_ids);
        }
        else if (class_id) {
            allClassIds.push(class_id);
        }
        // Enroll student in all selected classes
        for (const cid of allClassIds) {
            await database_1.default.studentClassEnrollment.create({
                data: {
                    student_id: student.id,
                    class_id: cid,
                    enrollment_date: new Date().toISOString(),
                },
            });
            await database_1.default.class.update({
                where: { id: cid },
                data: { current_students_count: { increment: 1 } },
            });
        }
        // Enroll in subjects - supports both flat array and per-class map
        // subjects can be: ["Physics", "Maths"] (legacy, applied to class_id)
        // OR: { "class-uuid-1": ["Physics"], "class-uuid-2": ["Chemistry"] }
        if (subjects) {
            if (Array.isArray(subjects) && subjects.length > 0 && allClassIds.length > 0) {
                // Legacy flat array - apply to first class
                const targetClassId = class_id || allClassIds[0];
                await database_1.default.studentSubjectEnrollment.createMany({
                    data: subjects.map((subj) => ({
                        student_id: student.id,
                        class_id: targetClassId,
                        subject: subj,
                        enrollment_date: new Date().toISOString(),
                        status: 'active',
                    })),
                    skipDuplicates: true,
                });
            }
            else if (typeof subjects === 'object' && !Array.isArray(subjects)) {
                // Per-class subject map
                for (const [cid, subjectList] of Object.entries(subjects)) {
                    if (Array.isArray(subjectList) && subjectList.length > 0) {
                        await database_1.default.studentSubjectEnrollment.createMany({
                            data: subjectList.map((subj) => ({
                                student_id: student.id,
                                class_id: cid,
                                subject: subj,
                                enrollment_date: new Date().toISOString(),
                                status: 'active',
                            })),
                            skipDuplicates: true,
                        });
                    }
                }
            }
        }
        (0, cache_1.invalidateCache)('/api/students');
        // Notify newly enrolled student with login credentials
        sendMail_1.mailEventEmitter.emit('student.created', {
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            email: student.email || userEmail,
            proId: student.PRO_ID,
            tempPass: password,
        });
        res.status(201).json({
            success: true,
            data: {
                student: { ...student, id: student.id },
                credentials: { email: student.email, password, pro_id: proId },
            },
        });
    }
    catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'field';
            res.status(400).json({ success: false, message: `An account with this ${field} already exists. Please use a different one.` });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
// PUT /api/students/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const { class_ids, subjects, password, ...studentFields } = req.body;
        // Update basic student info
        const student = await database_1.default.student.update({
            where: { id },
            data: studentFields,
        });
        if (password && student.user_id) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const password_hash = await bcryptjs_1.default.hash(password, salt);
            await database_1.default.user.update({ where: { id: student.user_id }, data: { password_hash } });
        }
        // If class_ids provided, sync class enrollments
        if (class_ids && Array.isArray(class_ids)) {
            const existing = await database_1.default.studentClassEnrollment.findMany({
                where: { student_id: id },
                select: { class_id: true },
            });
            const existingIds = existing.map(e => e.class_id);
            // Add new enrollments
            const toAdd = class_ids.filter((cid) => !existingIds.includes(cid));
            for (const cid of toAdd) {
                await database_1.default.studentClassEnrollment.create({
                    data: { student_id: id, class_id: cid, enrollment_date: new Date().toISOString() },
                });
                await database_1.default.class.update({ where: { id: cid }, data: { current_students_count: { increment: 1 } } });
            }
            // Remove old enrollments
            const toRemove = existingIds.filter(cid => !class_ids.includes(cid));
            for (const cid of toRemove) {
                await database_1.default.studentClassEnrollment.deleteMany({ where: { student_id: id, class_id: cid } });
                await database_1.default.studentSubjectEnrollment.deleteMany({ where: { student_id: id, class_id: cid } });
                await database_1.default.class.update({ where: { id: cid }, data: { current_students_count: { decrement: 1 } } });
            }
        }
        // If subjects map provided { class_id: ["subject1", "subject2"] }, sync per-class
        if (subjects && typeof subjects === 'object' && !Array.isArray(subjects)) {
            for (const [cid, subjectList] of Object.entries(subjects)) {
                if (!Array.isArray(subjectList))
                    continue;
                // Remove old subject enrollments for this class
                await database_1.default.studentSubjectEnrollment.deleteMany({ where: { student_id: id, class_id: cid } });
                // Create new ones
                if (subjectList.length > 0) {
                    await database_1.default.studentSubjectEnrollment.createMany({
                        data: subjectList.map((subj) => ({
                            student_id: id,
                            class_id: cid,
                            subject: subj,
                            enrollment_date: new Date().toISOString(),
                            status: 'active',
                        })),
                        skipDuplicates: true,
                    });
                }
            }
        }
        (0, cache_1.invalidateCache)('/api/students');
        res.json({ success: true, data: { ...student, id: student.id } });
    }
    catch (error) {
        console.error('PUT /students/:id error:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/students/:id/enroll
router.post('/:id/enroll', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const { class_id, subjects } = req.body;
        if (!class_id) {
            res.status(400).json({ success: false, message: 'Class ID is required' });
            return;
        }
        const student = await database_1.default.student.findUnique({ where: { id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const existing = await database_1.default.studentClassEnrollment.findFirst({
            where: { student_id: student.id, class_id },
        });
        if (existing) {
            res.status(400).json({ success: false, message: 'Student already enrolled in this class' });
            return;
        }
        const enrollment = await database_1.default.studentClassEnrollment.create({
            data: {
                student_id: student.id,
                class_id,
                enrollment_date: new Date().toISOString(),
                enrollment_status: 'active',
            },
        });
        // Enroll in specific subjects if provided
        if (subjects && Array.isArray(subjects) && subjects.length > 0) {
            await database_1.default.studentSubjectEnrollment.createMany({
                data: subjects.map((subj) => ({
                    student_id: student.id,
                    class_id,
                    subject: subj,
                    enrollment_date: new Date().toISOString(),
                    status: 'active',
                })),
                skipDuplicates: true,
            });
        }
        await database_1.default.class.update({
            where: { id: class_id },
            data: { current_students_count: { increment: 1 } },
        });
        res.json({ success: true, message: 'Student enrolled successfully', data: enrollment });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id/attendance
router.get('/:id/attendance', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const student = isUUID(id)
            ? await database_1.default.student.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const { month, year, class_id } = req.query;
        let attWhere = { student_id: student.id };
        if (month && year) {
            const prefix = `${year}-${String(parseInt(month)).padStart(2, '0')}`;
            attWhere.attendance_date = { startsWith: prefix };
        }
        if (class_id) {
            attWhere.class_id = class_id;
        }
        // Fetch records, enrollments, and subject enrollments in parallel
        const [records, enrollments, subjectEnrollments] = await Promise.all([
            database_1.default.attendance.findMany({
                where: attWhere,
                orderBy: { attendance_date: 'desc' },
                include: {
                    class: { select: { id: true, class_name: true, class_code: true, subject: true } },
                },
            }),
            database_1.default.studentClassEnrollment.findMany({
                where: { student_id: student.id, enrollment_status: 'active' },
                include: {
                    class: { select: { id: true, class_name: true, class_code: true, subject: true } },
                },
            }),
            database_1.default.studentSubjectEnrollment.findMany({
                where: { student_id: student.id, status: 'active' },
                select: { class_id: true, subject: true },
            }),
        ]);
        const enrolledClasses = enrollments.map(e => ({
            id: e.class?.id,
            class_name: e.class?.class_name,
            class_code: e.class?.class_code,
            subject: e.class?.subject,
            enrollment_date: e.enrollment_date,
            subjects: subjectEnrollments.filter(se => se.class_id === e.class_id).map(se => se.subject),
        }));
        const totalRecords = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;
        res.json({
            success: true,
            data: {
                records: records.map(r => ({
                    ...r,
                    class_name: r.class?.class_name,
                    class_code: r.class?.class_code,
                    class_subject: r.class?.subject,
                })),
                enrolled_classes: enrolledClasses,
                enrollment_date: student.enrollment_date,
                summary: {
                    total: totalRecords,
                    present,
                    absent: totalRecords - present - late,
                    late,
                    percentage: totalRecords > 0 ? ((present + late) / totalRecords * 100).toFixed(1) : 0,
                },
            },
        });
    }
    catch (error) {
        console.error('Student attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id/tests
router.get('/:id/tests', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const student = isUUID(id)
            ? await database_1.default.student.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const results = await database_1.default.testResult.findMany({
            where: { student_id: student.id },
            include: { test: true },
        });
        const validResults = results.map((tr) => ({ ...tr, test: tr.test }));
        const avgPercentage = validResults.length > 0
            ? (validResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / validResults.length).toFixed(1)
            : 0;
        res.json({
            success: true,
            data: {
                results: validResults,
                summary: {
                    total_tests: validResults.length,
                    average_percentage: parseFloat(String(avgPercentage)),
                    passed: validResults.filter((r) => r.pass_fail === 'pass').length,
                    failed: validResults.filter((r) => r.pass_fail === 'fail').length,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id/fees
router.get('/:id/fees', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const student = isUUID(id)
            ? await database_1.default.student.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const assignment = await database_1.default.studentFeeAssignment.findFirst({ where: { student_id: student.id } });
        const payments = await database_1.default.feePayment.findMany({ where: { student_id: student.id } });
        const structure = assignment?.fee_structure_id
            ? await database_1.default.feeStructure.findUnique({ where: { id: assignment.fee_structure_id } })
            : null;
        res.json({ success: true, data: { assignment, payments, structure } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id/homework-history
router.get('/:id/homework-history', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        let student = null;
        if (id === 'me' && req.user?.role === 'student') {
            student = await database_1.default.student.findUnique({ where: { user_id: req.user.id } });
        }
        else if (isUUID(id)) {
            student = await database_1.default.student.findUnique({ where: { id } });
        }
        else {
            student = await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        }
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const submissions = await database_1.default.homeworkSubmission.findMany({
            where: {
                student_id: student.id,
                status: { in: ['submitted', 'late', 'evaluated'] },
            },
            include: { homework: true },
            orderBy: { submission_date: 'desc' },
        });
        res.json({ success: true, data: submissions });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id/performance
router.get('/:id/performance', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        let student = null;
        if (id === 'me' && req.user?.role === 'student') {
            student = await database_1.default.student.findUnique({ where: { user_id: req.user.id } });
        }
        else if (isUUID(id)) {
            student = await database_1.default.student.findUnique({ where: { id } });
        }
        else {
            student = await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        }
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const results = await database_1.default.testResult.findMany({
            where: { student_id: student.id },
            include: { test: true },
        });
        const subjectPerformance = {};
        results.forEach((r) => {
            const subject = r.test?.subject || 'General';
            if (!subjectPerformance[subject]) {
                subjectPerformance[subject] = { total: 0, count: 0 };
            }
            subjectPerformance[subject].total += r.percentage || 0;
            subjectPerformance[subject].count += 1;
        });
        const subjectAnalytics = Object.keys(subjectPerformance).map(s => ({
            subject: s,
            average: parseFloat((subjectPerformance[s].total / subjectPerformance[s].count).toFixed(1)),
        }));
        const trend = results
            .filter((r) => r.test)
            .sort((a, b) => new Date(a.test.test_date || '').getTime() - new Date(b.test.test_date || '').getTime())
            .map((r) => ({
            date: r.test.test_date,
            score: r.percentage,
            name: r.test.test_name,
        }));
        res.json({ success: true, data: { subjectAnalytics, trend } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/students/:id
router.post('/delete-many', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            res.status(400).json({ success: false, message: 'IDs array required' });
            return;
        }
        // Delete related records
        await database_1.default.studentSubjectEnrollment.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.studentClassEnrollment.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.attendance.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.testResult.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.homeworkSubmission.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.studentFeeAssignment.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.feePayment.deleteMany({ where: { student_id: { in: ids } } });
        await database_1.default.studentQuery.deleteMany({ where: { student_id: { in: ids } } });
        // Get user_ids to delete associated user accounts
        const students = await database_1.default.student.findMany({ where: { id: { in: ids } }, select: { user_id: true } });
        const userIds = students.map(s => s.user_id).filter(id => id);
        await database_1.default.student.deleteMany({ where: { id: { in: ids } } });
        if (userIds.length > 0) {
            // Need to delete user records without throwing errors if they have other associations, 
            // but student user accounts typically don't. 
            await database_1.default.user.deleteMany({ where: { id: { in: userIds } } });
        }
        (0, cache_1.invalidateCache)('/api/students');
        res.json({ success: true, message: 'Students deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/students/:id/subjects - Update subject enrollments for a student
router.put('/:id/subjects', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const id = paramId(req);
        const { class_id, subjects } = req.body;
        if (!class_id || !subjects || !Array.isArray(subjects)) {
            res.status(400).json({ success: false, message: 'class_id and subjects array are required' });
            return;
        }
        const student = await database_1.default.student.findUnique({ where: { id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        // Remove all existing subject enrollments for this class
        await database_1.default.studentSubjectEnrollment.deleteMany({
            where: { student_id: student.id, class_id },
        });
        // Create new subject enrollments
        if (subjects.length > 0) {
            await database_1.default.studentSubjectEnrollment.createMany({
                data: subjects.map((subj) => ({
                    student_id: student.id,
                    class_id,
                    subject: subj,
                    enrollment_date: new Date().toISOString(),
                    status: 'active',
                })),
                skipDuplicates: true,
            });
        }
        const updatedEnrollments = await database_1.default.studentSubjectEnrollment.findMany({
            where: { student_id: student.id, class_id, status: 'active' },
        });
        res.json({ success: true, data: updatedEnrollments, message: 'Subject enrollments updated' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const id = paramId(req);
        const student = await database_1.default.student.findUnique({ where: { id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        // Delete related records
        await database_1.default.studentSubjectEnrollment.deleteMany({ where: { student_id: id } });
        await database_1.default.studentClassEnrollment.deleteMany({ where: { student_id: id } });
        await database_1.default.attendance.deleteMany({ where: { student_id: id } });
        await database_1.default.testResult.deleteMany({ where: { student_id: id } });
        await database_1.default.homeworkSubmission.deleteMany({ where: { student_id: id } });
        await database_1.default.studentFeeAssignment.deleteMany({ where: { student_id: id } });
        await database_1.default.feePayment.deleteMany({ where: { student_id: id } });
        await database_1.default.studentQuery.deleteMany({ where: { student_id: id } });
        await database_1.default.student.delete({ where: { id } });
        if (student.user_id) {
            // Find and delete any queries created by this user just in case
            await database_1.default.studentQuery.deleteMany({ where: { created_by_user_id: student.user_id } });
            await database_1.default.user.delete({ where: { id: student.user_id } });
        }
        (0, cache_1.invalidateCache)('/api/students');
        res.json({ success: true, message: 'Student and associated data deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/students/:id/remarks
router.get('/:id/remarks', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = paramId(req);
        const student = isUUID(id)
            ? await database_1.default.student.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const remarks = await database_1.default.studentRemark.findMany({
            where: { student_id: student.id },
            orderBy: { created_at: 'desc' },
            include: {
                teacher: {
                    select: { first_name: true, last_name: true }
                }
            }
        });
        res.json({ success: true, data: remarks });
    }
    catch (error) {
        console.error('[Remarks GET] error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/students/:id/remarks
router.post('/:id/remarks', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator', 'teacher'), async (req, res) => {
    try {
        const id = paramId(req);
        const student = isUUID(id)
            ? await database_1.default.student.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.student.findUnique({ where: { PRO_ID: id } });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const { remark, remark_type } = req.body;
        if (!remark || !remark.trim()) {
            res.status(400).json({ success: false, message: 'Remark text is required' });
            return;
        }
        // Resolve teacher profile for current user
        let teacherId;
        if (req.user.role === 'teacher') {
            const teacher = await database_1.default.teacher.findUnique({ where: { user_id: req.user.id } });
            if (!teacher) {
                res.status(403).json({ success: false, message: 'Teacher profile not found' });
                return;
            }
            teacherId = teacher.id;
        }
        else {
            // If admin, we can default to any teacher, or look for the first teacher in class
            const classEnrollment = await database_1.default.studentClassEnrollment.findFirst({
                where: { student_id: student.id },
                include: { class: true }
            });
            const t = await database_1.default.teacher.findFirst(); // Fallback to any teacher record for relation constraint
            if (!t) {
                res.status(400).json({ success: false, message: 'No teacher profile exists in the system' });
                return;
            }
            teacherId = classEnrollment?.class?.primary_teacher_id || t.id;
        }
        const newRemark = await database_1.default.studentRemark.create({
            data: {
                student_id: student.id,
                teacher_id: teacherId,
                remark: remark.trim(),
                remark_type: remark_type || 'general'
            },
            include: {
                teacher: { select: { first_name: true, last_name: true } }
            }
        });
        if (req.user.role === 'teacher') {
            const { logTeacherActivity } = require('../utils/activityLogger');
            await logTeacherActivity(req.user.id, 'remarks_add', null, remark.trim(), `Remarks for student ${student.first_name} ${student.last_name} (${student.PRO_ID})`, req);
        }
        res.status(201).json({ success: true, data: newRemark, message: 'Remark added successfully' });
    }
    catch (error) {
        console.error('[Remarks POST] error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=students.js.map
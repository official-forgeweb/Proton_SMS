const express = require('express');
const { Enquiry, EnquiryRemark, DemoClass, Teacher, User } = require('../models');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

const generateEnquiryNumber = () => `ENQ${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const generateDemoNumber = () => `DEMO${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// GET /api/enquiries/demos/all
router.get('/demos/all', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const demos = await DemoClass.find().sort({ demo_date: -1 }).lean();
        // Populate enquiry details
        for (let i = 0; i < demos.length; i++) {
            const eq = await Enquiry.findById(demos[i].enquiry_id).lean();
            demos[i].enquiry = eq;
            demos[i].id = demos[i]._id;
        }
        res.json({ success: true, data: demos });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/enquiries/demos/:id
router.put('/demos/:id', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const demo = await DemoClass.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!demo) return res.status(404).json({ success: false, message: 'Demo not found' });

        // Optional logic: if demo is completed, update enquiry status
        if (req.body.status === 'completed') {
            await Enquiry.findByIdAndUpdate(demo.enquiry_id, { status: 'demo_completed' });
            await EnquiryRemark.create({
                enquiry_id: demo.enquiry_id,
                remark_type: 'meeting',
                remark: `Demo class #${demo.demo_count || 1} marked as completed.`,
                created_by: req.user.id
            });
        }

        res.json({ success: true, data: { ...demo, id: demo._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/enquiries
router.get('/', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const { search, status, source, priority, assigned_to, page = 1, limit = 50 } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { student_name: new RegExp(search, 'i') },
                { enquiry_number: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') }
            ];
        }
        if (status) query.status = status;
        if (source) query.source = source;
        if (priority) query.priority = priority;
        if (assigned_to) query.assigned_to = assigned_to;

        const total = await Enquiry.countDocuments(query);
        const startIdx = (page - 1) * limit;

        const enquiries = await Enquiry.find(query)
            .sort({ created_at: -1 })
            .skip(startIdx)
            .limit(parseInt(limit))
            .lean();

        // Enrich with teacher
        for (let i = 0; i < enquiries.length; i++) {
            if (enquiries[i].assigned_to) {
                const teacher = await Teacher.findOne({ user_id: enquiries[i].assigned_to }).lean();
                enquiries[i].assigned_teacher_name = teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : null;
            }
            enquiries[i].id = enquiries[i]._id;
        }

        res.json({
            success: true,
            data: enquiries,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/enquiries/stats
router.get('/stats', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const total = await Enquiry.countDocuments();

        const statusGroups = await Enquiry.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
        const statusCounts = {};
        statusGroups.forEach(g => { if (g._id) statusCounts[g._id] = g.count; });

        const sourceGroups = await Enquiry.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]);
        const sourceCounts = {};
        sourceGroups.forEach(g => { if (g._id) sourceCounts[g._id] = g.count; });

        const enrolled = await Enquiry.countDocuments({ converted_to_student: true });
        const conversionRate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: { total, by_status: statusCounts, by_source: sourceCounts, enrolled, conversion_rate: parseFloat(conversionRate) },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/enquiries/:id
router.get('/:id', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id).lean();
        if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

        const remarks = await EnquiryRemark.find({ enquiry_id: enquiry._id }).sort({ created_at: -1 }).lean();
        const demos = await DemoClass.find({ enquiry_id: enquiry._id }).sort({ demo_date: -1 }).lean();
        const teacher = await Teacher.findOne({ user_id: enquiry.assigned_to }).lean();

        res.json({
            success: true,
            data: {
                ...enquiry,
                id: enquiry._id,
                assigned_teacher: teacher ? { name: `${teacher.first_name} ${teacher.last_name}`, ...teacher, id: teacher._id } : null,
                remarks: remarks.map(r => ({ ...r, id: r._id })),
                demos: demos.map(d => ({ ...d, id: d._id })),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/enquiries
router.post('/', async (req, res) => {
    try {
        const enquiry = await Enquiry.create({
            enquiry_number: generateEnquiryNumber(),
            ...req.body,
            status: 'new',
            priority: req.body.priority || 'medium',
        });

        res.status(201).json({ success: true, data: { ...enquiry.toObject(), id: enquiry._id }, message: `Enquiry created: ${enquiry.enquiry_number}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PUT /api/enquiries/:id
router.put('/:id', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const oldEnquiry = await Enquiry.findById(req.params.id);
        if (!oldEnquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

        const oldStatus = oldEnquiry.status;
        const updated = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();

        if (req.body.status && req.body.status !== oldStatus) {
            await EnquiryRemark.create({
                enquiry_id: req.params.id,
                remark_type: 'follow_up',
                remark: `Status changed from ${oldStatus} to ${req.body.status}`,
                created_by: req.user.id
            });
        }

        res.json({ success: true, data: { ...updated, id: updated._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/enquiries/:id/remarks
router.post('/:id/remarks', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

        const remark = await EnquiryRemark.create({
            enquiry_id: req.params.id,
            ...req.body,
            created_by: req.user.id
        });

        enquiry.followup_count = (enquiry.followup_count || 0) + 1;
        if (req.body.status) enquiry.status = req.body.status;
        await enquiry.save();

        const teacher = await Teacher.findOne({ user_id: req.user.id }).lean();
        const user = await User.findById(req.user.id).lean();

        res.status(201).json({
            success: true,
            data: { ...remark.toObject(), id: remark._id, added_by_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : (user?.email || 'Admin') },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/enquiries/:id/schedule-demo
router.post('/:id/schedule-demo', authenticateToken, authorize('admin', 'teacher'), async (req, res) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

        const existingCount = await DemoClass.countDocuments({ enquiry_id: enquiry._id });

        const demo = await DemoClass.create({
            demo_number: generateDemoNumber(),
            enquiry_id: enquiry._id,
            demo_date: req.body.demo_date,
            demo_time: req.body.demo_time,
            subject: req.body.subject || enquiry.interested_course,
            topic: req.body.topic,
            class_id: req.body.class_id,
            teacher_id: req.body.teacher_id,
            demo_count: existingCount + 1,
        });

        enquiry.status = 'demo_scheduled';
        await enquiry.save();

        res.status(201).json({ success: true, data: { ...demo.toObject(), id: demo._id } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

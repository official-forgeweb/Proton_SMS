"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const generateCoordinatorId = () => `COORD${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
const paramId = (req) => String(req.params.id);
// GET /api/coordinators
router.get('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const { search, status } = req.query;
        let where = {};
        if (search) {
            where.OR = [
                { full_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { coordinator_id: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        const coordinators = await database_1.default.coordinator.findMany({ where });
        res.json({ success: true, data: coordinators });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/coordinators/:id
router.get('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const id = paramId(req);
        const coordinator = isUUID(id)
            ? await database_1.default.coordinator.findFirst({ where: { OR: [{ id }, { user_id: id }] } })
            : await database_1.default.coordinator.findFirst({ where: { coordinator_id: id } });
        if (!coordinator) {
            res.status(404).json({ success: false, message: 'Coordinator not found' });
            return;
        }
        res.json({ success: true, data: coordinator });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/coordinators
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const { full_name, email, phone, gender, profile_image, status } = req.body;
        const salt = await bcryptjs_1.default.genSalt(10);
        const password = req.body.password || `Coord@${Math.floor(1000 + Math.random() * 9000)}`;
        const user = await database_1.default.user.create({
            data: { email, password_hash: await bcryptjs_1.default.hash(password, salt), role: 'coordinator' },
        });
        const coordinator = await database_1.default.coordinator.create({
            data: {
                user_id: user.id,
                coordinator_id: generateCoordinatorId(),
                full_name,
                email,
                phone,
                gender,
                profile_image: profile_image || null,
                status: status || 'active',
                created_by: req.user.id,
            },
        });
        res.status(201).json({
            success: true,
            data: { coordinator, credentials: { email, password } },
            message: `Coordinator onboarded successfully: ${coordinator.coordinator_id}`,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// PUT /api/coordinators/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const id = paramId(req);
        const { password, ...coordinatorFields } = req.body;
        const coordinator = await database_1.default.coordinator.update({
            where: { id },
            data: coordinatorFields,
        });
        if (password && coordinator.user_id) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const password_hash = await bcryptjs_1.default.hash(password, salt);
            await database_1.default.user.update({ where: { id: coordinator.user_id }, data: { password_hash } });
        }
        res.json({ success: true, data: coordinator });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Coordinator not found' });
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// DELETE /api/coordinators/:id
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const id = paramId(req);
        const coordinator = await database_1.default.coordinator.findUnique({ where: { id } });
        if (!coordinator) {
            res.status(404).json({ success: false, message: 'Coordinator not found' });
            return;
        }
        await database_1.default.coordinator.delete({ where: { id } });
        if (coordinator.user_id) {
            await database_1.default.user.delete({ where: { id: coordinator.user_id } });
        }
        res.json({ success: true, message: 'Coordinator deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=coordinators.js.map
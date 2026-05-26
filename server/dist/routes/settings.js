"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get the global settings
router.get('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        let settings = await database_1.default.systemSetting.findUnique({
            where: { id: 'global' }
        });
        // Initialize if not exists
        if (!settings) {
            settings = await database_1.default.systemSetting.create({
                data: { id: 'global' }
            });
        }
        res.json({ success: true, data: settings });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});
// Update the global settings
router.patch('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const updateData = req.body;
        const updated = await database_1.default.systemSetting.upsert({
            where: { id: 'global' },
            update: updateData,
            create: { id: 'global', ...updateData }
        });
        res.json({ success: true, data: updated, message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map
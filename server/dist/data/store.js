"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const seedData = async () => {
    try {
        const adminExists = await database_1.default.user.findUnique({
            where: { email: 'admin@protoncoaching.com' },
        });
        if (!adminExists) {
            console.log('🌱 Seeding initial demo data to PostgreSQL...');
            const salt = await bcryptjs_1.default.genSalt(10);
            // 1. Create Default Admin
            await database_1.default.user.create({
                data: {
                    email: 'admin@protoncoaching.com',
                    password_hash: await bcryptjs_1.default.hash('Admin@123', salt),
                    role: 'admin',
                    is_active: true,
                    is_verified: true,
                },
            });
            console.log('✅ Admin account seeded successfully!');
        }
        else {
            console.log('✅ Database already contains an Admin. Skipping seeding.');
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error during database seeding:', message);
    }
};
exports.seedData = seedData;
//# sourceMappingURL=store.js.map
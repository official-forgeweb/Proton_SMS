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
            // 2. Create Teacher
            const teacherUser = await database_1.default.user.create({
                data: {
                    email: 'amit@protoncoaching.com',
                    password_hash: await bcryptjs_1.default.hash('Teacher@123', salt),
                    role: 'teacher',
                    is_active: true,
                    is_verified: true,
                },
            });
            await database_1.default.teacher.create({
                data: {
                    user_id: teacherUser.id,
                    first_name: 'Amit',
                    last_name: 'Sharma',
                    employee_id: 'EMP1001',
                    phone: '+91-9876543211',
                    gender: 'male',
                },
            });
            // 3. Create Student
            const studentUser = await database_1.default.user.create({
                data: {
                    email: 'rahul.sharma@email.com',
                    password_hash: await bcryptjs_1.default.hash('Student@123', salt),
                    role: 'student',
                    is_active: true,
                    is_verified: true,
                },
            });
            await database_1.default.student.create({
                data: {
                    user_id: studentUser.id,
                    first_name: 'Rahul',
                    last_name: 'Sharma',
                    PRO_ID: 'PRO10001',
                    phone: '+91-9876543212',
                    gender: 'male',
                },
            });
            console.log('✅ Demo Credentials Seeded Successfully!');
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
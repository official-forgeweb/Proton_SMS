const { User, Student, Teacher, Parent, Class, StudentClassEnrollment, FeeStructure } = require('../models');
const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');
const generateId = () => new mongoose.Types.ObjectId().toString();

const seedData = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@protoncoaching.com' });
        if (!adminExists) {
            console.log('🌱 Seeding initial demo data to MongoDB...');
            const salt = await bcrypt.genSalt(10);

            // 1. Create Default Admin
            await User.create({
                email: 'admin@protoncoaching.com',
                password_hash: await bcrypt.hash('Admin@123', salt),
                role: 'admin',
                is_active: true,
                is_verified: true,
            });

            // 2. Create Teacher
            const teacherUser = await User.create({
                email: 'amit@protoncoaching.com',
                password_hash: await bcrypt.hash('Teacher@123', salt),
                role: 'teacher',
                is_active: true,
                is_verified: true,
            });
            await Teacher.create({
                user_id: teacherUser._id,
                first_name: 'Amit',
                last_name: 'Sharma',
                employee_id: 'EMP1001',
                phone: '+91-9876543211',
                gender: 'male'
            });

            // 3. Create Student
            const studentUser = await User.create({
                email: 'rahul.sharma@email.com',
                password_hash: await bcrypt.hash('Student@123', salt),
                role: 'student',
                is_active: true,
                is_verified: true,
            });
            await Student.create({
                user_id: studentUser._id,
                first_name: 'Rahul',
                last_name: 'Sharma',
                PRO_ID: 'PRO10001',
                phone: '+91-9876543212',
                gender: 'male'
            });

            // 4. Create Parent
            const parentUser = await User.create({
                email: 'parent.sharma@email.com',
                password_hash: await bcrypt.hash('Parent@123', salt),
                role: 'parent',
                is_active: true,
                is_verified: true,
            });
            await Parent.create({
                user_id: parentUser._id,
                first_name: 'Mr.',
                last_name: 'Sharma',
                phone: '+91-9876543213',
            });

            console.log('✅ Demo Credentials Seeded Successfully!');
        } else {
            console.log('✅ Database already contains an Admin. Skipping seeding.');
        }

    } catch (error) {
        console.error('❌ Error during database seeding:', error.message);
    }
};

module.exports = {
    seedData,
    generateId,
    store: {} // Empty to prevent errors in code that might still import store accidentally
};

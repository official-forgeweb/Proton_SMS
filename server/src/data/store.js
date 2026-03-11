const { User, Student, Teacher, Parent, Class, StudentClassEnrollment, FeeStructure } = require('../models');
const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');
const generateId = () => new mongoose.Types.ObjectId().toString();

const seedData = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@protoncoaching.com' });
        if (!adminExists) {
            console.log('🌱 Seeding initial admin data to MongoDB...');
            const salt = await bcrypt.genSalt(10);

            // 1. Create Default Admin
            await User.create({
                email: 'admin@protoncoaching.com',
                password_hash: await bcrypt.hash('Admin@123', salt),
                role: 'admin',
                is_active: true,
                is_verified: true,
            });

            console.log('✅ Initial Admin created: admin@protoncoaching.com / Admin@123');
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

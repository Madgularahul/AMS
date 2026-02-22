/**
 * Seed script - creates a default admin user
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@ams.com' });
    if (existing) {
      console.log('Admin already exists: admin@ams.com / admin123');
      process.exit(0);
    }

    await User.create({
      name: 'Super Admin',
      email: 'admin@ams.com',
      password: 'admin123',
      role: 'admin',
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email: admin@ams.com');
    console.log('   Password: admin123');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
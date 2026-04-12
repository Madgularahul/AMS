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

    // Delete existing standard seed accounts to reset passwords
    await User.deleteMany({ email: { $in: ['admin@ams.com', 'faculty@ams.com', 'student@ams.com'] } });

    // 1. Admin
    await User.create({
      name: 'Super Admin', 
      email: 'admin@ams.com',
      password: 'admin123', 
      role: 'admin'
    });
    console.log('✅ Admin: admin@ams.com / admin123');

    // 2. Faculty
    await User.create({
      name: 'Test Faculty', 
      email: 'faculty@ams.com',
      password: 'faculty123', 
      role: 'faculty'
    });
    console.log('✅ Faculty: faculty@ams.com / faculty123');

    // 3. Department (required for Student)
    const Department = require('./models/Department');
    const dept = await Department.findOneAndUpdate(
      { code: 'CSE' },
      { name: 'Computer Science', code: 'CSE' },
      { upsert: true, new: true }
    );

    // 4. Section (required for Student)
    const Section = require('./models/Section');
    const sec = await Section.findOneAndUpdate(
      { sectionName: 'A' },
      { sectionName: 'A', department: dept._id, year: 1, semester: 1 },
      { upsert: true, new: true }
    );

    // 5. Student
    await User.create({
      name: 'Test Student', 
      email: 'student@ams.com',
      password: 'student123', 
      role: 'student', 
      department: dept._id, 
      section: sec._id,
      rollNumber: 'STU001'
    });
    console.log('✅ Student: student@ams.com / student123');
    
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
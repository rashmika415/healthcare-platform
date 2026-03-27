const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

const User = require('./models/userModel');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    // Hash password
    const hashed = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      name:       'Platform Admin',
      email:      'admin@healthcare.com',
      password:   hashed,
      role:       'admin',
      isVerified: true
    });

    console.log('✅ Admin created successfully');
    console.log('   Email:   ', admin.email);
    console.log('   Password: admin123');
    console.log('   Change the password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
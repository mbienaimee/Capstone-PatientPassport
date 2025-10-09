const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../dist/models/User').default;

async function resetHospitalPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the hospital user
    const hospitalUser = await User.findOne({ 
      email: 'bienaimeemariereine@gmail.com',
      role: 'hospital'
    });
    
    if (!hospitalUser) {
      console.log('Hospital user not found');
      return;
    }
    
    console.log('Found hospital user:', hospitalUser.email);

    // Reset password
    const newPassword = 'hospital123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    hospitalUser.password = hashedPassword;
    await hospitalUser.save();

    console.log('Password reset successfully!');
    console.log('Email: bienaimeemariereine@gmail.com');
    console.log('New Password: hospital123');

    // Test login
    const testUser = await User.findOne({ email: 'bienaimeemariereine@gmail.com' }).select('+password');
    const passwordMatch = await testUser.comparePassword('hospital123');
    console.log('Password test result:', passwordMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetHospitalPassword();



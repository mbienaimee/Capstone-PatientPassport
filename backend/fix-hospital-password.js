const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function fixHospitalPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const hospitalEmail = 'reine123e@gmail.com';
    const password = 'password123';

    // Find the hospital user
    const hospitalUser = await User.findOne({ email: hospitalEmail });
    if (!hospitalUser) {
      console.log('❌ Hospital user not found');
      return;
    }

    console.log('👤 Found hospital user:', hospitalUser.email);
    console.log('🔑 Current password hash length:', hospitalUser.password ? hospitalUser.password.length : 'No password');

    // Set a proper password
    const hashedPassword = await bcrypt.hash(password, 12);
    hospitalUser.password = hashedPassword;
    hospitalUser.isActive = true;
    hospitalUser.isEmailVerified = true;
    await hospitalUser.save();

    console.log('✅ Password updated successfully');

    // Test the password
    const isPasswordValid = await hospitalUser.comparePassword(password);
    console.log('✅ Password test result:', isPasswordValid);

    console.log('\n🎉 Hospital user password fixed!');
    console.log('📋 Login Credentials:');
    console.log('Email:', hospitalEmail);
    console.log('Password:', password);

  } catch (error) {
    console.error('❌ Error fixing hospital password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixHospitalPassword();

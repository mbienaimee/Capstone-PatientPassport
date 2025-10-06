const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;

async function fixUserVerification() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const email = 'bienaimee@gmail.com';

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('📧 Is Email Verified:', user.isEmailVerified);
    console.log('✅ Is Active:', user.isActive);
    console.log('🔑 Has Password:', !!user.password);

    // Fix verification status
    user.isEmailVerified = true;
    user.isActive = true;
    await user.save();

    console.log('✅ User verification status updated');
    console.log('📧 Is Email Verified:', user.isEmailVerified);
    console.log('✅ Is Active:', user.isActive);

    // Test password again
    const isPasswordValid = await user.comparePassword('password123');
    console.log('🔑 Password test result:', isPasswordValid);

    console.log('\n🎉 User is now ready for login!');
    console.log('📋 Login Credentials:');
    console.log('Email:', email);
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error fixing user verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the fix
fixUserVerification();

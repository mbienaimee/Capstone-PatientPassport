const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function createHospitalUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    const hospitalId = '68e41de879d2b412e642d44b';
    const hospitalEmail = 'reine123e@gmail.com';
    const password = 'password123'; // You can change this

    // Find the hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      console.log('❌ Hospital not found with ID:', hospitalId);
      return;
    }

    console.log('🏥 Found hospital:', hospital.name);
    console.log('📧 Admin contact:', hospital.adminContact);

    // Check if user already exists
    let user = await User.findOne({ email: hospitalEmail });
    
    if (user) {
      console.log('👤 User already exists:', user.email);
      console.log('🔑 Updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
      user.role = 'hospital';
      user.isActive = true;
      user.isEmailVerified = true;
      await user.save();
      
      console.log('✅ User password updated');
    } else {
      console.log('👤 Creating new hospital user...');
      
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await User.create({
        name: hospital.name + ' Admin',
        email: hospitalEmail,
        password: hashedPassword,
        role: 'hospital',
        isActive: true,
        isEmailVerified: true
      });
      
      console.log('✅ User created:', user.email);
    }

    // Update hospital to link with user
    hospital.user = user._id;
    await hospital.save();

    console.log('✅ Hospital linked to user');

    console.log('\n🎉 Hospital user setup complete!');
    console.log('📋 Login Credentials:');
    console.log('  Email:', hospitalEmail);
    console.log('  Password:', password);
    console.log('  Role: hospital');
    console.log('  Hospital ID:', hospitalId);

  } catch (error) {
    console.error('❌ Error creating hospital user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the function
createHospitalUser();

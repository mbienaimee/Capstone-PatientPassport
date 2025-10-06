const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./dist/models/User').default;
const Hospital = require('./dist/models/Hospital').default;

async function seedTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({ role: 'hospital' });
    await Hospital.deleteMany({});
    console.log('🧹 Cleared existing hospital data');

    // Create test hospital user
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const hospitalUser = await User.create({
      name: 'Test Hospital Admin',
      email: 'admin@testhospital.com',
      password: hashedPassword,
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });

    console.log('✅ Created hospital user:', hospitalUser.email);

    // Create test hospital
    const hospital = await Hospital.create({
      user: hospitalUser._id,
      name: 'Test General Hospital',
      address: '123 Test Street, Test City, TC 12345',
      contact: '+1-555-0123',
      licenseNumber: 'HOSP001',
      adminContact: 'admin@testhospital.com',
      status: 'active'
    });

    console.log('✅ Created hospital:', hospital.name);
    console.log('🏥 Hospital ID:', hospital._id);
    console.log('🏥 Hospital License:', hospital.licenseNumber);

    // Create another test hospital
    const hospitalUser2 = await User.create({
      name: 'Metro Medical Admin',
      email: 'admin@metromedical.com',
      password: hashedPassword,
      role: 'hospital',
      isActive: true,
      isEmailVerified: true
    });

    const hospital2 = await Hospital.create({
      user: hospitalUser2._id,
      name: 'Metro Medical Center',
      address: '456 Medical Ave, Metro City, MC 67890',
      contact: '+1-555-0456',
      licenseNumber: 'HOSP002',
      adminContact: 'admin@metromedical.com',
      status: 'active'
    });

    console.log('✅ Created second hospital:', hospital2.name);
    console.log('🏥 Hospital ID:', hospital2._id);

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📋 Test Login Credentials:');
    console.log('Hospital 1: admin@testhospital.com / password123');
    console.log('Hospital 2: admin@metromedical.com / password123');
    console.log('\n🏥 Hospital IDs:');
    console.log('Hospital 1 ID:', hospital._id);
    console.log('Hospital 2 ID:', hospital2._id);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the seeding function
seedTestData();

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Hospital = require('../dist/models/Hospital').default;

async function fixKingFaisalHospitalAccount() {
  try {
    console.log('Fixing King Faisal Hospital Account...\n');

    // Step 1: Find or create King Faisal user
    let kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    });

    if (!kingFaisalUser) {
      console.log('Creating King Faisal hospital user...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);

      kingFaisalUser = await User.create({
        name: 'King Faisal',
        email: 'kingfaisal@hospital.com',
        password: hashedPassword,
        role: 'hospital',
        isActive: true,
        isEmailVerified: true
      });
      console.log('✅ King Faisal user created');
    } else {
      console.log('King Faisal user found, updating password...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      kingFaisalUser.password = hashedPassword;
      kingFaisalUser.isEmailVerified = true;
      kingFaisalUser.isActive = true;
      await kingFaisalUser.save();
      console.log('✅ King Faisal user updated');
    }

    // Step 2: Create or update hospital profile
    let hospital = await Hospital.findOne({ user: kingFaisalUser._id });

    if (!hospital) {
      console.log('Creating King Faisal hospital profile...');
      hospital = await Hospital.create({
        user: kingFaisalUser._id,
        name: 'King Faisal Hospital',
        address: '123 Medical Street, Kigali, Rwanda',
        contact: '+250790840767',
        licenseNumber: 'HOSP-KF-001',
        adminContact: 'kingfaisal@hospital.com',
        status: 'active'
      });
      console.log('✅ Hospital profile created');
    } else {
      console.log('Hospital profile found, updating...');
      hospital.name = 'King Faisal Hospital';
      hospital.address = '123 Medical Street, Kigali, Rwanda';
      hospital.contact = '+250790840767';
      hospital.licenseNumber = 'HOSP-KF-001';
      hospital.status = 'active';
      await hospital.save();
      console.log('✅ Hospital profile updated');
    }

    // Step 3: Verify the setup
    console.log('\n=== Verification ===');
    const updatedUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');

    const updatedHospital = await Hospital.findOne({ user: kingFaisalUser._id });

    console.log('User Status:');
    console.log('- Name:', updatedUser.name);
    console.log('- Email:', updatedUser.email);
    console.log('- Role:', updatedUser.role);
    console.log('- Is Active:', updatedUser.isActive);
    console.log('- Is Email Verified:', updatedUser.isEmailVerified);
    console.log('- Has Password:', !!updatedUser.password);

    console.log('\nHospital Status:');
    console.log('- Name:', updatedHospital.name);
    console.log('- License Number:', updatedHospital.licenseNumber);
    console.log('- Status:', updatedHospital.status);
    console.log('- Address:', updatedHospital.address);
    console.log('- Contact:', updatedHospital.contact);

    // Step 4: Test password verification
    console.log('\n=== Password Test ===');
    const passwordTest = await updatedUser.comparePassword('password123');
    console.log('Password verification result:', passwordTest);

    // Step 5: Test login flow simulation
    console.log('\n=== Login Flow Test ===');
    const canLoginDirectly = updatedUser.isActive && updatedUser.isEmailVerified && updatedUser.role === 'hospital';
    console.log('Can login directly to hospital dashboard:', canLoginDirectly);

    if (canLoginDirectly) {
      console.log('✅ King Faisal can now login with:');
      console.log('  - Email: kingfaisal@hospital.com');
      console.log('  - Password: password123');
      console.log('✅ Will be redirected directly to hospital dashboard');
      console.log('✅ No OTP verification required');
    }

    console.log('\n🎉 King Faisal Hospital Account Setup Complete!');
    console.log('\nLogin Credentials:');
    console.log('Email: kingfaisal@hospital.com');
    console.log('Password: password123');
    console.log('Role: hospital');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing King Faisal hospital account:', error);
    process.exit(1);
  }
}

fixKingFaisalHospitalAccount();

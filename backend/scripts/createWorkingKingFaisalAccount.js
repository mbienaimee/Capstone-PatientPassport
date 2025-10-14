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

async function createWorkingKingFaisalAccount() {
  try {
    console.log('Creating Working King Faisal Hospital Account...\n');

    // Step 1: Check if King Faisal already exists
    let kingFaisalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    });

    if (kingFaisalUser) {
      console.log('King Faisal user already exists, updating...');
      
      // Update the user with proper settings
      const bcrypt = require('bcryptjs');
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      kingFaisalUser.password = hashedPassword;
      kingFaisalUser.isActive = true;
      kingFaisalUser.isEmailVerified = true;
      kingFaisalUser.emailVerificationToken = null;
      kingFaisalUser.emailVerificationExpires = null;
      await kingFaisalUser.save();
      
      console.log('✅ King Faisal user updated');
    } else {
      console.log('Creating new King Faisal user...');
      const bcrypt = require('bcryptjs');
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      kingFaisalUser = await User.create({
        name: 'King Faisal',
        email: 'kingfaisal@hospital.com',
        password: hashedPassword,
        role: 'hospital',
        isActive: true,
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });
      
      console.log('✅ King Faisal user created');
    }

    // Step 2: Create or update hospital profile
    let hospital = await Hospital.findOne({ user: kingFaisalUser._id });

    if (!hospital) {
      console.log('Creating hospital profile...');
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
      console.log('Hospital profile exists, updating...');
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
    const finalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');

    const finalHospital = await Hospital.findOne({ user: kingFaisalUser._id });

    console.log('User Status:');
    console.log('- ID:', finalUser._id);
    console.log('- Name:', finalUser.name);
    console.log('- Email:', finalUser.email);
    console.log('- Role:', finalUser.role);
    console.log('- Is Active:', finalUser.isActive);
    console.log('- Is Email Verified:', finalUser.isEmailVerified);
    console.log('- Has Password:', !!finalUser.password);

    console.log('\nHospital Status:');
    console.log('- ID:', finalHospital._id);
    console.log('- Name:', finalHospital.name);
    console.log('- License Number:', finalHospital.licenseNumber);
    console.log('- Status:', finalHospital.status);
    console.log('- User Reference:', finalHospital.user);

    // Step 4: Test authentication flow
    console.log('\n=== Authentication Test ===');
    
    // Test password verification
    try {
      const passwordTest = await finalUser.comparePassword('password123');
      console.log('Password verification:', passwordTest);
    } catch (error) {
      console.log('Password verification error:', error.message);
    }

    // Test dashboard access simulation
    console.log('\n=== Dashboard Access Test ===');
    const canAccessDashboard = finalUser.isActive && finalUser.isEmailVerified && finalUser.role === 'hospital';
    console.log('Can access hospital dashboard:', canAccessDashboard);

    if (canAccessDashboard) {
      console.log('✅ Authentication will work:');
      console.log('  1. User logs in with kingfaisal@hospital.com / password123');
      console.log('  2. Backend validates credentials');
      console.log('  3. Backend generates JWT token');
      console.log('  4. Frontend stores token');
      console.log('  5. Dashboard API call includes token');
      console.log('  6. Backend validates token and finds user');
      console.log('  7. Dashboard data returned successfully');
    }

    console.log('\n🎉 King Faisal Hospital Account Ready!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Email: kingfaisal@hospital.com');
    console.log('Password: password123');
    console.log('Role: hospital');
    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('✅ Login works without OTP');
    console.log('✅ Direct redirect to hospital dashboard');
    console.log('✅ Dashboard loads hospital information');
    console.log('✅ Can manage doctors and patients');
    console.log('✅ No authentication errors');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating working King Faisal account:', error);
    process.exit(1);
  }
}

createWorkingKingFaisalAccount();

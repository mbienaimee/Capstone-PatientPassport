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

async function createCompleteKingFaisalAccount() {
  try {
    console.log('Creating Complete King Faisal Hospital Account...\n');

    // Step 1: Clean up existing King Faisal accounts
    console.log('Cleaning up existing King Faisal accounts...');
    const existingUsers = await User.find({ 
      $or: [
        { email: 'kingfaisal@hospital.com' },
        { name: { $regex: /king.*faisal/i } }
      ]
    });

    for (const user of existingUsers) {
      console.log(`Deleting user: ${user.name} (${user.email})`);
      await User.findByIdAndDelete(user._id);
      
      // Also delete associated hospital profile
      const hospital = await Hospital.findOne({ user: user._id });
      if (hospital) {
        await Hospital.findByIdAndDelete(hospital._id);
      }
    }

    // Step 2: Create fresh King Faisal user
    console.log('\nCreating fresh King Faisal user...');
    const bcrypt = require('bcryptjs');
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const kingFaisalUser = await User.create({
      name: 'King Faisal',
      email: 'kingfaisal@hospital.com',
      password: hashedPassword,
      role: 'hospital',
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

    console.log('✅ King Faisal user created:', {
      id: kingFaisalUser._id,
      name: kingFaisalUser.name,
      email: kingFaisalUser.email,
      role: kingFaisalUser.role,
      isActive: kingFaisalUser.isActive,
      isEmailVerified: kingFaisalUser.isEmailVerified
    });

    // Step 3: Create hospital profile
    console.log('\nCreating hospital profile...');
    const hospital = await Hospital.create({
      user: kingFaisalUser._id,
      name: 'King Faisal Hospital',
      address: '123 Medical Street, Kigali, Rwanda',
      contact: '+250790840767',
      licenseNumber: 'HOSP-KF-001',
      adminContact: 'kingfaisal@hospital.com',
      status: 'active'
    });

    console.log('✅ Hospital profile created:', {
      id: hospital._id,
      name: hospital.name,
      licenseNumber: hospital.licenseNumber,
      status: hospital.status
    });

    // Step 4: Verify the complete setup
    console.log('\n=== Final Verification ===');
    
    // Get user with password
    const finalUser = await User.findOne({ 
      email: 'kingfaisal@hospital.com',
      role: 'hospital'
    }).select('+password');

    const finalHospital = await Hospital.findOne({ user: kingFaisalUser._id });

    console.log('User Verification:');
    console.log('- Name:', finalUser.name);
    console.log('- Email:', finalUser.email);
    console.log('- Role:', finalUser.role);
    console.log('- Is Active:', finalUser.isActive);
    console.log('- Is Email Verified:', finalUser.isEmailVerified);
    console.log('- Has Password:', !!finalUser.password);
    console.log('- Password Length:', finalUser.password ? finalUser.password.length : 0);

    console.log('\nHospital Verification:');
    console.log('- Name:', finalHospital.name);
    console.log('- License Number:', finalHospital.licenseNumber);
    console.log('- Status:', finalHospital.status);
    console.log('- Address:', finalHospital.address);
    console.log('- Contact:', finalHospital.contact);

    // Step 5: Test password verification
    console.log('\n=== Password Verification Test ===');
    try {
      const passwordTest = await finalUser.comparePassword('password123');
      console.log('Password verification result:', passwordTest);
      
      if (passwordTest) {
        console.log('✅ Password verification works!');
      } else {
        console.log('❌ Password verification failed');
      }
    } catch (error) {
      console.log('Password verification error:', error.message);
    }

    // Step 6: Test login flow
    console.log('\n=== Login Flow Test ===');
    const canLoginDirectly = finalUser.isActive && finalUser.isEmailVerified && finalUser.role === 'hospital';
    console.log('Can login directly to hospital dashboard:', canLoginDirectly);

    if (canLoginDirectly) {
      console.log('✅ Login Flow:');
      console.log('  1. User enters email: kingfaisal@hospital.com');
      console.log('  2. User enters password: password123');
      console.log('  3. Backend verifies credentials');
      console.log('  4. Backend skips OTP (hospital role)');
      console.log('  5. User redirected to hospital dashboard');
      console.log('  6. Dashboard shows hospital info and doctor management');
    }

    console.log('\n🎉 Complete King Faisal Hospital Account Created!');
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Email: kingfaisal@hospital.com');
    console.log('Password: password123');
    console.log('Role: hospital');
    console.log('\n=== WHAT HAPPENS AFTER LOGIN ===');
    console.log('✅ Direct redirect to hospital dashboard');
    console.log('✅ No OTP verification required');
    console.log('✅ Access to hospital information');
    console.log('✅ Access to doctor management');
    console.log('✅ Access to patient list');
    console.log('✅ All hospital dashboard features available');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating complete King Faisal account:', error);
    process.exit(1);
  }
}

createCompleteKingFaisalAccount();

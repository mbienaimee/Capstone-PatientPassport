const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;

async function resetDoctorPassword() {
  try {
    console.log('🔧 Resetting doctor password to original...\n');

    const doctorEmail = 'm36391038@gmail.com';
    const originalPassword = 'Umurerwa123!';

    console.log('Looking for doctor with email:', doctorEmail);
    
    const doctorUser = await User.findOne({ email: doctorEmail, role: 'doctor' });
    
    if (!doctorUser) {
      console.log('❌ Doctor user not found');
      return;
    }

    console.log('Found doctor user:', {
      id: doctorUser._id,
      name: doctorUser.name,
      email: doctorUser.email,
      role: doctorUser.role
    });

    // Reset password to original
    console.log('Resetting password to original:', originalPassword);
    doctorUser.password = originalPassword;
    await doctorUser.save();
    
    console.log('✅ Password reset successfully!');
    console.log('📧 Email:', doctorUser.email);
    console.log('🔑 Password:', originalPassword);
    console.log('💡 The doctor can now login with the original password');

    console.log('\n🎉 Password reset completed!');
    console.log('✅ Doctor can now login with:');
    console.log('   Email: m36391038@gmail.com');
    console.log('   Password: Umurerwa123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting doctor password:', error);
    process.exit(1);
  }
}

resetDoctorPassword();

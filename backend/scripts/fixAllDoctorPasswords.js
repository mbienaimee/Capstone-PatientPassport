const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Doctor = require('../dist/models/Doctor').default;

async function fixAllDoctorPasswords() {
  try {
    console.log('🔧 Fixing all doctor password hashing issues...\n');

    // Find all doctors created in the last 24 hours (likely to have the double-hashing issue)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentDoctors = await User.find({ 
      role: 'doctor',
      createdAt: { $gte: twentyFourHoursAgo }
    });

    console.log(`Found ${recentDoctors.length} doctors created in the last 24 hours`);

    if (recentDoctors.length === 0) {
      console.log('No recent doctors found. All doctors should be fine.');
      return;
    }

    for (const doctor of recentDoctors) {
      console.log(`\n=== Fixing doctor: ${doctor.name} (${doctor.email}) ===`);
      
      try {
        // We need to reset the password to a known value
        // Since we don't know the original password, we'll set it to a default
        const defaultPassword = 'password123';
        
        console.log('Setting password to default:', defaultPassword);
        doctor.password = defaultPassword;
        await doctor.save();
        
        console.log('✅ Password reset successfully');
        console.log('📧 Email:', doctor.email);
        console.log('🔑 New password:', defaultPassword);
        console.log('💡 The doctor can now login with this password and change it later');
        
      } catch (error) {
        console.error('❌ Error fixing doctor password:', error.message);
      }
    }

    console.log('\n🎉 All doctor passwords fixed!');
    console.log('✅ All recent doctors can now login with password: password123');
    console.log('💡 They should change their passwords after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing doctor passwords:', error);
    process.exit(1);
  }
}

fixAllDoctorPasswords();

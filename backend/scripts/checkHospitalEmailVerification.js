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

async function checkHospitalEmailVerification() {
  try {
    console.log('Checking hospital email verification status...\n');

    // Find King Faisal's hospital
    const kingFaisalUser = await User.findOne({ 
      $or: [
        { name: { $regex: /king.*faisal/i } },
        { name: { $regex: /faisal/i } }
      ]
    });

    if (kingFaisalUser) {
      console.log('King Faisal User Status:');
      console.log('- ID:', kingFaisalUser._id);
      console.log('- Name:', kingFaisalUser.name);
      console.log('- Email:', kingFaisalUser.email);
      console.log('- Role:', kingFaisalUser.role);
      console.log('- Is Active:', kingFaisalUser.isActive);
      console.log('- Is Email Verified:', kingFaisalUser.isEmailVerified);
      console.log('- Email Verification Token:', kingFaisalUser.emailVerificationToken);
      console.log('- Email Verification Expires:', kingFaisalUser.emailVerificationExpires);
      console.log('- Created At:', kingFaisalUser.createdAt);
      console.log('- Updated At:', kingFaisalUser.updatedAt);
    } else {
      console.log('❌ King Faisal user not found');
    }

    // Check all hospital users
    console.log('\n=== All Hospital Users ===');
    const hospitalUsers = await User.find({ role: 'hospital' });
    console.log(`Total hospital users: ${hospitalUsers.length}`);
    
    hospitalUsers.forEach((user, index) => {
      console.log(`\nHospital ${index + 1}:`);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Is Active:', user.isActive);
      console.log('- Is Email Verified:', user.isEmailVerified);
      console.log('- Has Verification Token:', !!user.emailVerificationToken);
    });

    // Check unverified hospital users
    const unverifiedHospitals = await User.find({ 
      role: 'hospital', 
      isEmailVerified: false 
    });
    
    console.log(`\n=== Unverified Hospital Users: ${unverifiedHospitals.length} ===`);
    unverifiedHospitals.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Token: ${!!user.emailVerificationToken}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking hospital email verification:', error);
    process.exit(1);
  }
}

checkHospitalEmailVerification();

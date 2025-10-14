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

async function checkKingFaisalData() {
  try {
    console.log('Checking King Faisal registration data...\n');

    // Find King Faisal user
    const kingFaisalUser = await User.findOne({ 
      $or: [
        { name: { $regex: /king.*faisal/i } },
        { name: { $regex: /faisal/i } }
      ]
    });

    if (kingFaisalUser) {
      console.log('✅ Found King Faisal user:');
      console.log('User ID:', kingFaisalUser._id);
      console.log('Name:', kingFaisalUser.name);
      console.log('Email:', kingFaisalUser.email);
      console.log('Role:', kingFaisalUser.role);
      console.log('Created:', kingFaisalUser.createdAt);
      
      // Check if he has a hospital profile
      const hospitalProfile = await Hospital.findOne({ user: kingFaisalUser._id });
      if (hospitalProfile) {
        console.log('\n✅ Hospital profile found:');
        console.log('Hospital ID:', hospitalProfile._id);
        console.log('Hospital Name:', hospitalProfile.name);
        console.log('License Number:', hospitalProfile.licenseNumber);
        console.log('Address:', hospitalProfile.address);
        console.log('Contact:', hospitalProfile.contact);
        console.log('Admin Contact:', hospitalProfile.adminContact || 'Not set');
      } else {
        console.log('\n❌ No hospital profile found for King Faisal');
      }
    } else {
      console.log('❌ King Faisal user not found');
      
      // Show all hospital users
      console.log('\nAll hospital users:');
      const hospitalUsers = await User.find({ role: 'hospital' });
      hospitalUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking King Faisal data:', error);
    process.exit(1);
  }
}

checkKingFaisalData();

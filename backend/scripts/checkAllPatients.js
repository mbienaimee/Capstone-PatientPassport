const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('../dist/models/User').default;
const Patient = require('../dist/models/Patient').default;

async function checkAllPatients() {
  try {
    console.log('Checking all users with patient role...');

    // Find all users with patient role
    const patientUsers = await User.find({ role: 'patient' });
    
    console.log(`Found ${patientUsers.length} users with patient role:`);
    
    for (const user of patientUsers) {
      console.log(`\nUser: ${user.name} (${user.email})`);
      
      // Check if they have a patient profile
      const patientProfile = await Patient.findOne({ user: user._id });
      
      if (patientProfile) {
        console.log(`  ✅ Has Patient profile: ${patientProfile.nationalId}`);
      } else {
        console.log(`  ❌ Missing Patient profile!`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking patients:', error);
    process.exit(1);
  }
}

checkAllPatients();

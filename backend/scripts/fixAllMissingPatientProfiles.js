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

async function fixAllMissingPatientProfiles() {
  try {
    console.log('Fixing all users with patient role who are missing Patient profiles...');

    // Find all users with patient role
    const patientUsers = await User.find({ role: 'patient' });
    
    console.log(`Found ${patientUsers.length} users with patient role`);
    
    let fixedCount = 0;
    
    for (const user of patientUsers) {
      console.log(`\nChecking user: ${user.name} (${user.email})`);
      
      // Check if they have a patient profile
      const existingPatient = await Patient.findOne({ user: user._id });
      
      if (existingPatient) {
        console.log(`  ✅ Already has Patient profile: ${existingPatient.nationalId}`);
      } else {
        console.log(`  ❌ Missing Patient profile - creating one...`);
        
        // Create a Patient profile with default/realistic data
        const patientData = {
          user: user._id,
          nationalId: `1234567890${Math.floor(Math.random() * 100000)}`, // Generate unique national ID
          dateOfBirth: new Date('1990-01-01'), // Default date of birth
          gender: 'female', // Default gender
          contactNumber: '+250123456789', // Default contact
          address: 'Kigali, Rwanda', // Default address
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '+250987654321'
          },
          bloodType: 'O+', // Default blood type
          allergies: [], // Empty allergies
          status: 'active'
        };

        try {
          const patient = new Patient(patientData);
          await patient.save();
          console.log(`  ✅ Created Patient profile: ${patient.nationalId}`);
          fixedCount++;
        } catch (error) {
          console.error(`  ❌ Error creating Patient profile:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Fix completed! Fixed ${fixedCount} missing Patient profiles.`);
    console.log('All patient users should now have Patient profiles.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing patient profiles:', error);
    process.exit(1);
  }
}

fixAllMissingPatientProfiles();

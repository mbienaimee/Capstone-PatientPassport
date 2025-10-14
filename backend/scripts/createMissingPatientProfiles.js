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

async function createMissingPatientProfiles() {
  try {
    console.log('Creating Patient profiles for all users with patient role...');

    // Find all users with patient role
    const patientUsers = await User.find({ role: 'patient' });
    
    console.log(`Found ${patientUsers.length} users with patient role`);
    
    for (const user of patientUsers) {
      console.log(`\nProcessing user: ${user.name} (${user.email})`);
      
      // Check if they already have a patient profile
      const existingPatient = await Patient.findOne({ user: user._id });
      
      if (existingPatient) {
        console.log(`  ✅ Already has Patient profile: ${existingPatient.nationalId}`);
      } else {
        console.log(`  ❌ Missing Patient profile - creating one...`);
        
        // Generate a unique national ID
        const nationalId = `1234567890${Math.floor(Math.random() * 100000)}`;
        
        // Create Patient profile with realistic data
        const patientData = {
          user: user._id,
          nationalId: nationalId,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'female', // Default gender
          contactNumber: '+250123456789',
          address: 'Kigali, Rwanda',
          emergencyContact: {
            name: 'Emergency Contact',
            relationship: 'Family',
            phone: '+250987654321'
          },
          bloodType: 'O+',
          allergies: [],
          status: 'active'
        };

        try {
          const patient = new Patient(patientData);
          await patient.save();
          console.log(`  ✅ Created Patient profile with National ID: ${nationalId}`);
        } catch (error) {
          console.error(`  ❌ Error creating Patient profile:`, error.message);
        }
      }
    }

    console.log('\n🎉 All patient users now have Patient profiles!');
    console.log('\nNext steps:');
    console.log('1. Deploy the updated frontend with gender field');
    console.log('2. New patient registrations will work correctly');
    console.log('3. Existing patients can update their profiles');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating patient profiles:', error);
    process.exit(1);
  }
}

createMissingPatientProfiles();

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Hospital = require('./dist/models/Hospital').default;

async function updateHospitalStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/patientpassport');
    console.log('✅ Connected to MongoDB');

    // Find the specific hospital
    const hospitalId = '68e41de879d2b412e642d44b';
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      console.log('❌ Hospital not found with ID:', hospitalId);
      return;
    }

    console.log('🏥 Found hospital:', hospital.name);
    console.log('📊 Current status:', hospital.status);

    // Update status to active
    hospital.status = 'active';
    await hospital.save();

    console.log('✅ Hospital status updated to:', hospital.status);
    console.log('🎉 Hospital can now manage doctors!');

  } catch (error) {
    console.error('❌ Error updating hospital status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the update function
updateHospitalStatus();

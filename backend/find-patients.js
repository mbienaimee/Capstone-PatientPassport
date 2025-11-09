require('dotenv').config();
const mongoose = require('mongoose');

async function findPatients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Patient = mongoose.model('Patient', new mongoose.Schema({
      firstName: String,
      lastName: String,
      nationalId: String,
      email: String
    }));

    // Find all patients with "williams" in name
    const patients = await Patient.find({
      $or: [
        { firstName: /williams/i },
        { lastName: /williams/i },
        { firstName: /betty/i }
      ]
    });

    console.log(`📋 Found ${patients.length} patients matching "Betty" or "Williams":\n`);

    if (patients.length > 0) {
      patients.forEach((patient, index) => {
        console.log(`${index + 1}. ${patient.firstName} ${patient.lastName}`);
        console.log(`   ID: ${patient._id}`);
        console.log(`   National ID: ${patient.nationalId}`);
        console.log(`   Email: ${patient.email}`);
        console.log('');
      });
    } else {
      console.log('No patients found with Betty or Williams\n');
    }

    // Also check all patients
    const allPatients = await Patient.find().limit(10);
    console.log(`\n📊 First 10 patients in database:`);
    allPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.firstName} ${patient.lastName} (ID: ${patient._id})`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

findPatients();

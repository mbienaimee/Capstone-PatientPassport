require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

async function listPatients() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const patientSchema = new mongoose.Schema({}, { strict: false });
    const Patient = mongoose.model('Patient', patientSchema, 'patients');

    const patients = await Patient.find()
      .populate('user', 'name email')
      .select('_id user openmrsData nationalId');

    console.log(`📊 Found ${patients.length} patient(s) in system:\n`);

    patients.forEach((patient, idx) => {
      console.log(`${idx + 1}. Patient ID: ${patient._id}`);
      console.log(`   Name: ${patient.user?.name || 'Unknown'}`);
      console.log(`   National ID: ${patient.nationalId || 'N/A'}`);
      console.log(`   OpenMRS UUID: ${patient.openmrsData?.uuid || 'NOT LINKED'}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listPatients();

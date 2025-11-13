const mongoose = require('mongoose');
require('dotenv').config();

const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({
  patientId: String,
  type: String,
  data: Object,
  createdBy: String,
  openmrsData: Object
}, { timestamps: true }));

const Patient = mongoose.model('Patient', new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  nationalId: String
}, { collection: 'patients' }));

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { collection: 'users' }));

async function checkBettyRecords() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      process.exit(1);
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find Betty Williams user
    const user = await User.findOne({ name: /Betty Williams/i, role: 'patient' });
    console.log('\n👤 Betty Williams User:', user ? user._id : 'Not found');

    if (user) {
      // Find Betty's patient document
      const patient = await Patient.findOne({ user: user._id });
      console.log('📋 Betty Williams Patient:', patient ? patient._id : 'Not found');

      if (patient) {
        // Find all medical records for Betty
        const records = await MedicalRecord.find({ patientId: patient._id });
        console.log(`\n📊 Medical Records for Betty (patientId: ${patient._id}):`);
        console.log(`   Total Records: ${records.length}`);

        records.forEach((record, index) => {
          console.log(`\n   Record ${index + 1}:`);
          console.log(`     ID: ${record._id}`);
          console.log(`     Type: ${record.type}`);
          console.log(`     Data:`, record.data);
          console.log(`     OpenMRS Data:`, record.openmrsData);
          console.log(`     Created: ${record.createdAt}`);
        });

        // Also check with string comparison
        console.log(`\n🔍 Checking with string patientId...`);
        const recordsStr = await MedicalRecord.find({ patientId: patient._id.toString() });
        console.log(`   Records found with string ID: ${recordsStr.length}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBettyRecords();

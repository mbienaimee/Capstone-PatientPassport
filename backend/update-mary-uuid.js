require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

const patientSchema = new mongoose.Schema({}, { strict: false });
const Patient = mongoose.model('Patient', patientSchema, 'patients');

async function updateMarySmithUUID() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const marySmithId = '691b4ca38530430ed1d1ca77';
    const openmrsUUID = '577fd437-9d81-4c1a-b324-36e3e9ac058c';

    console.log(`📝 Updating Mary Smith's OpenMRS UUID...`);
    console.log(`   Patient ID: ${marySmithId}`);
    console.log(`   New UUID: ${openmrsUUID}\n`);

    const result = await Patient.findByIdAndUpdate(
      marySmithId,
      {
        $set: {
          'openmrsData.uuid': openmrsUUID,
          'openmrsData.personId': 102  // The person_id from OpenMRS observation
        }
      },
      { new: true }
    );

    if (result) {
      console.log('✅ Mary Smith updated successfully!');
      console.log(`   OpenMRS UUID: ${result.openmrsData?.uuid}`);
      console.log(`   OpenMRS Person ID: ${result.openmrsData?.personId}`);
    } else {
      console.log('❌ Patient not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateMarySmithUUID();

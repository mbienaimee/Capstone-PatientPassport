require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

const patientSchema = new mongoose.Schema({}, { strict: false });
const Patient = mongoose.model('Patient', patientSchema, 'patients');

async function findMarySmith() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Searching for Mary Smith...\n');

    // Search by name
    const patients = await Patient.find({}).lean();
    
    console.log(`📊 Found ${patients.length} total patients\n`);

    // Also get User collection
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const users = await User.find({}).lean();
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = u);

    const marySmith = patients.filter(p => {
      const userId = p.user?.toString() || p.user?._id?.toString();
      const user = userMap[userId];
      const name = user?.name || '';
      return name.toLowerCase().includes('mary') || name.toLowerCase().includes('smith');
    });

    console.log(`📋 Found ${marySmith.length} patient(s) matching "Mary Smith":\n`);

    marySmith.forEach((patient, idx) => {
      const userId = patient.user?.toString() || patient.user?._id?.toString();
      const user = userMap[userId];
      console.log(`${idx + 1}. Patient:`);
      console.log(`   ID: ${patient._id}`);
      console.log(`   Name: ${user?.name || 'N/A'}`);
      console.log(`   National ID: ${patient.nationalId || 'N/A'}`);
      console.log(`   OpenMRS UUID: ${patient.openmrsData?.uuid || 'NOT SET'}`);
      console.log(`   OpenMRS Person ID: ${patient.openmrsData?.personId || 'NOT SET'}`);
      console.log('');
    });

    // Check the observation patient UUID
    const observationUUID = '577fd437-9d81-4c1a-b324-36e3e9ac058c';
    console.log(`\n🔍 Checking if any patient has observation UUID: ${observationUUID}\n`);

    const matchingPatient = await Patient.findOne({
      'openmrsData.uuid': observationUUID
    });

    if (matchingPatient) {
      const userId = matchingPatient.user?.toString() || matchingPatient.user?._id?.toString();
      const matchUser = await User.findById(userId).lean();
      console.log(`✅ Found patient with matching UUID!`);
      console.log(`   ID: ${matchingPatient._id}`);
      console.log(`   Name: ${matchUser?.name || 'N/A'}`);
    } else {
      console.log(`❌ No patient found with UUID: ${observationUUID}`);
      console.log(`\n💡 Mary Smith's OpenMRS UUID needs to be updated to: ${observationUUID}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

findMarySmith();

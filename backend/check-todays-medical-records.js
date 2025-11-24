require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';

// MedicalRecord schema
const medicalRecordSchema = new mongoose.Schema({
  patientId: String,
  type: String,
  data: Object,
  openmrsData: Object,
  syncDate: Date,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema, 'medicalrecords');

async function checkTodaysMedicalRecords() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📅 Checking MedicalRecord collection for records from today (${today.toDateString()})...\n`);

    // Find all medical records from today
    const todaysRecords = await MedicalRecord.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${todaysRecords.length} medical record(s) from TODAY:\n`);

    if (todaysRecords.length === 0) {
      console.log('❌ No medical records found for today');
      console.log('\n🔍 Checking most recent records instead...\n');
      
      const recentRecords = await MedicalRecord.find()
        .sort({ createdAt: -1 })
        .limit(5);
      
      console.log(`📊 Most recent ${recentRecords.length} records:\n`);
      recentRecords.forEach((record, idx) => {
        console.log(`${idx + 1}. Record ID: ${record._id}`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Patient ID: ${record.patientId}`);
        console.log(`   Created: ${record.createdAt}`);
        console.log(`   Data: ${JSON.stringify(record.data, null, 2)}`);
        if (record.openmrsData) {
          console.log(`   OpenMRS Obs ID: ${record.openmrsData.obsId}`);
        }
        console.log('');
      });
    } else {
      todaysRecords.forEach((record, idx) => {
        console.log(`${idx + 1}. Record ID: ${record._id}`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Patient ID: ${record.patientId}`);
        console.log(`   Created: ${record.createdAt}`);
        console.log(`   Sync Date: ${record.syncDate || 'N/A'}`);
        console.log(`   Data:`);
        console.log(`      - Diagnosis: ${record.data?.diagnosis || record.data?.name || 'N/A'}`);
        console.log(`      - Doctor: ${record.data?.doctor || 'N/A'}`);
        console.log(`      - Hospital: ${record.data?.hospital || 'N/A'}`);
        console.log(`      - Notes: ${record.data?.notes || 'N/A'}`);
        if (record.openmrsData) {
          console.log(`   OpenMRS Data:`);
          console.log(`      - Obs ID: ${record.openmrsData.obsId}`);
          console.log(`      - Location: ${record.openmrsData.locationName}`);
          console.log(`      - Creator: ${record.openmrsData.creatorName}`);
        }
        console.log('');
      });
    }

    // Also check by syncDate
    console.log(`\n📅 Checking by syncDate (records synced today)...\n`);
    const syncedToday = await MedicalRecord.find({
      syncDate: { $gte: today, $lt: tomorrow }
    }).sort({ syncDate: -1 });

    console.log(`📊 Found ${syncedToday.length} record(s) synced today:\n`);
    
    if (syncedToday.length > 0) {
      syncedToday.forEach((record, idx) => {
        console.log(`${idx + 1}. Record ID: ${record._id}`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Patient ID: ${record.patientId}`);
        console.log(`   Synced: ${record.syncDate}`);
        console.log(`   Diagnosis: ${record.data?.diagnosis || record.data?.name || 'N/A'}`);
        if (record.openmrsData) {
          console.log(`   OpenMRS Obs ID: ${record.openmrsData.obsId}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTodaysMedicalRecords();

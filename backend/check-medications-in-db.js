const mongoose = require('mongoose');
require('dotenv').config();

// Define MedicalRecord schema directly
const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  type: String,
  data: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  syncDate: Date
}, { strict: false });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

const checkMedicationsInDB = async () => {
  try {
    console.log('\n🔍 Connecting to database...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Check latest conditions with medications
    console.log('📋 CHECKING LATEST CONDITIONS:\n');
    const conditions = await MedicalRecord.find({ type: 'condition' })
      .limit(5)
      .sort({ createdAt: -1 });

    conditions.forEach((record, idx) => {
      console.log(`\n--- CONDITION ${idx + 1} ---`);
      console.log('ID:', record._id.toString());
      console.log('Diagnosis:', record.data?.diagnosis || 'N/A');
      console.log('Doctor:', record.data?.doctor || 'N/A');
      console.log('Hospital:', record.data?.hospital || 'N/A');
      console.log('Created:', record.createdAt);
      
      const meds = record.data?.medications || [];
      console.log(`\n💊 Medications (${meds.length}):`);
      
      if (meds.length === 0) {
        console.log('   ❌ NO MEDICATIONS IN THIS CONDITION');
      } else {
        meds.forEach((med, i) => {
          console.log(`\n   Med ${i + 1}:`);
          console.log(`   - Name: ${med.name || 'N/A'}`);
          console.log(`   - Dosage: ${med.dosage || 'N/A'}`);
          console.log(`   - Frequency: ${med.frequency || 'N/A'}`);
          console.log(`   - Prescribed By: ${med.prescribedBy || 'N/A'}`);
          console.log(`   - Status: ${med.medicationStatus || 'N/A'}`);
        });
      }
    });

    // Check if there are any standalone medication records
    console.log('\n\n📋 CHECKING STANDALONE MEDICATION RECORDS:\n');
    const medications = await MedicalRecord.find({ type: 'medication' })
      .limit(5)
      .sort({ createdAt: -1 });

    console.log(`Found ${medications.length} standalone medication records`);
    medications.forEach((record, idx) => {
      console.log(`\n--- MEDICATION ${idx + 1} ---`);
      console.log('ID:', record._id.toString());
      console.log('Medication:', record.data?.medicationName || 'N/A');
      console.log('Dosage:', record.data?.dosage || 'N/A');
      console.log('Doctor:', record.data?.doctor || 'N/A');
      console.log('Created:', record.createdAt);
    });

    // Check total counts
    console.log('\n\n📊 DATABASE STATISTICS:\n');
    const totalConditions = await MedicalRecord.countDocuments({ type: 'condition' });
    const totalMedications = await MedicalRecord.countDocuments({ type: 'medication' });
    const conditionsWithMeds = await MedicalRecord.countDocuments({ 
      type: 'condition',
      'data.medications.0': { $exists: true }
    });

    console.log(`Total Conditions: ${totalConditions}`);
    console.log(`Total Standalone Medications: ${totalMedications}`);
    console.log(`Conditions with embedded medications: ${conditionsWithMeds}`);
    console.log(`Conditions WITHOUT medications: ${totalConditions - conditionsWithMeds}`);

    await mongoose.connection.close();
    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkMedicationsInDB();

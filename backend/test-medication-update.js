const mongoose = require('mongoose');
require('dotenv').config();

// Define schemas
const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  type: String,
  data: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  syncDate: Date,
  editableBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastEditedAt: Date
}, { strict: false });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

const testMedicationUpdate = async () => {
  try {
    console.log('\n🔍 Connecting to database...\n');
    await mongoose.connect(process.env.MONGODB_URI);

    // Get the first condition
    console.log('📋 Finding a condition to update...\n');
    const condition = await MedicalRecord.findOne({ type: 'condition' }).sort({ createdAt: -1 });

    if (!condition) {
      console.log('❌ No conditions found in database');
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Found condition:');
    console.log('   ID:', condition._id.toString());
    console.log('   Diagnosis:', condition.data?.diagnosis || 'N/A');
    console.log('   Current medications:', condition.data?.medications || []);
    console.log('');

    // Add medications
    console.log('💊 Adding medications to this condition...\n');
    const updatedData = {
      ...condition.data,
      medications: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Twice daily',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          prescribedBy: 'Dr. Test Doctor',
          medicationStatus: 'Active'
        },
        {
          name: 'Amoxicillin',
          dosage: '250mg',
          frequency: 'Three times daily',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          prescribedBy: 'Dr. Test Doctor',
          medicationStatus: 'Active'
        }
      ]
    };

    condition.data = updatedData;
    condition.lastEditedAt = new Date();
    await condition.save();

    console.log('✅ Medications saved successfully!\n');
    console.log('   Updated data:', {
      diagnosis: condition.data.diagnosis,
      medicationsCount: condition.data.medications.length
    });
    console.log('');

    // Verify the save
    console.log('🔍 Re-fetching condition to verify...\n');
    const updated = await MedicalRecord.findById(condition._id);
    console.log('✅ Verified medications in database:');
    console.log(`   Total medications: ${updated.data.medications?.length || 0}`);
    if (updated.data.medications) {
      updated.data.medications.forEach((med, idx) => {
        console.log(`\n   Med ${idx + 1}:`);
        console.log(`   - Name: ${med.name}`);
        console.log(`   - Dosage: ${med.dosage}`);
        console.log(`   - Frequency: ${med.frequency}`);
        console.log(`   - Prescribed By: ${med.prescribedBy}`);
        console.log(`   - Status: ${med.medicationStatus}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Test completed successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

testMedicationUpdate();

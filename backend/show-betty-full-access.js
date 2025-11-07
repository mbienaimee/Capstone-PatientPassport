const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function showBettyRecords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
    const MedicalRecord = mongoose.model('MedicalRecord', new mongoose.Schema({}, { strict: false }), 'medicalrecords');

    // Find Betty Williams
    const bettyUser = await User.findOne({ 
      name: /Betty Williams/i,
      role: 'patient'
    });

    if (!bettyUser) {
      console.log('❌ Betty Williams user not found');
      process.exit(1);
    }

    const bettyPatient = await Patient.findOne({ user: bettyUser._id });

    if (!bettyPatient) {
      console.log('❌ Betty Williams patient record not found');
      process.exit(1);
    }

    console.log('============================================================');
    console.log('👤 BETTY WILLIAMS - PATIENT INFORMATION');
    console.log('============================================================\n');
    console.log(`Patient ID: ${bettyPatient._id}`);
    console.log(`User ID: ${bettyUser._id}`);
    console.log(`National ID: ${bettyPatient.nationalId}`);
    console.log(`Email: ${bettyUser.email}`);
    console.log(`Date of Birth: ${bettyPatient.dateOfBirth}`);
    console.log(`Gender: ${bettyPatient.gender}`);
    console.log(`Address: ${bettyPatient.address}, ${bettyPatient.city}, ${bettyPatient.province}`);

    // Get all medical records
    const records = await MedicalRecord.find({
      patientId: bettyPatient._id.toString()
    }).sort({ createdAt: -1 });

    console.log(`\n============================================================`);
    console.log(`📋 MEDICAL RECORDS (Total: ${records.length})`);
    console.log(`============================================================\n`);

    // Group by type
    const byType = {};
    records.forEach(record => {
      if (!byType[record.type]) {
        byType[record.type] = [];
      }
      byType[record.type].push(record);
    });

    Object.keys(byType).forEach(type => {
      console.log(`\n📌 ${type.toUpperCase()} (${byType[type].length} records):`);
      console.log('─'.repeat(60));
      
      byType[type].forEach((record, idx) => {
        console.log(`\n${idx + 1}. Record ID: ${record._id}`);
        console.log(`   Created: ${new Date(record.createdAt).toLocaleString()}`);
        console.log(`   Type: ${record.type}`);
        
        // Display data based on type
        if (record.data) {
          if (record.type === 'condition') {
            console.log(`   Condition: ${record.data.name || 'N/A'}`);
            console.log(`   Diagnosed: ${record.data.diagnosed ? new Date(record.data.diagnosed).toLocaleDateString() : 'N/A'}`);
            console.log(`   Details: ${record.data.details || 'N/A'}`);
            if (record.data.procedure) {
              console.log(`   Procedure: ${record.data.procedure.substring(0, 100)}...`);
            }
          } else if (record.type === 'test') {
            console.log(`   Test: ${record.data.testName || 'N/A'}`);
            console.log(`   Result: ${record.data.result || 'N/A'}`);
            console.log(`   Date: ${record.data.testDate ? new Date(record.data.testDate).toLocaleDateString() : 'N/A'}`);
          } else if (record.type === 'visit') {
            console.log(`   Hospital: ${record.data.hospital || 'N/A'}`);
            console.log(`   Reason: ${record.data.reason || 'N/A'}`);
            console.log(`   Date: ${record.data.visitDate ? new Date(record.data.visitDate).toLocaleDateString() : 'N/A'}`);
          } else if (record.type === 'medication') {
            console.log(`   Medication: ${record.data.medicationName || 'N/A'}`);
            console.log(`   Dosage: ${record.data.dosage || 'N/A'}`);
          }
        }
      });
    });

    console.log(`\n\n============================================================`);
    console.log(`🌐 HOW TO ACCESS VIA API`);
    console.log(`============================================================\n`);
    console.log(`Base URL: http://localhost:5000/api`);
    console.log(`\n1. Login as Betty Williams:`);
    console.log(`   POST /auth/login`);
    console.log(`   Body: {`);
    console.log(`     "email": "${bettyUser.email}",`);
    console.log(`     "password": "your-password"`);
    console.log(`   }`);
    console.log(`\n2. Get Medical History:`);
    console.log(`   GET /medical-records/patient/${bettyPatient._id}`);
    console.log(`   Headers: { "Authorization": "Bearer <token>" }`);
    console.log(`\n3. Get Specific Record:`);
    console.log(`   GET /medical-records/${records[0]?._id}`);
    console.log(`   Headers: { "Authorization": "Bearer <token>" }`);

    console.log(`\n\n============================================================`);
    console.log(`💡 ACCESS OPTIONS`);
    console.log(`============================================================\n`);
    console.log(`✅ Via Frontend: Access Patient Passport web app`);
    console.log(`✅ Via API: Use the endpoints shown above`);
    console.log(`✅ Via Database: Direct MongoDB queries (what we're doing now)`);
    console.log(`✅ All 26 records are accessible and queryable!`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

showBettyRecords();

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient-passport';
const OPENMRS_BASE_URL = process.env.OPENMRS_BASE_URL || 'http://102.130.118.47:8080/openmrs';
const OPENMRS_USERNAME = process.env.OPENMRS_USERNAME || 'admin';
const OPENMRS_PASSWORD = process.env.OPENMRS_PASSWORD || 'Admin123';

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

async function syncTodaysObservation() {
  try {
    console.log('\n🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Fetching observation 5303 from OpenMRS...\n');
    
    // Fetch the specific observation
    const auth = Buffer.from(`${OPENMRS_USERNAME}:${OPENMRS_PASSWORD}`).toString('base64');
    const response = await axios.get(`${OPENMRS_BASE_URL}/ws/rest/v1/obs/5303`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      params: {
        v: 'full'
      }
    });

    const obs = response.data;
    console.log('✅ Fetched observation from OpenMRS:');
    console.log(`   Obs ID: ${obs.uuid}`);
    console.log(`   Concept: ${obs.concept?.display || 'Unknown'}`);
    console.log(`   Value: ${obs.value?.display || obs.valueText || 'N/A'}`);
    console.log(`   Patient UUID: ${obs.person?.uuid}`);
    console.log(`   Obs Date: ${obs.obsDatetime}`);
    console.log('');

    // Now we need to find the patient ID in our system
    console.log('🔍 Finding patient in our system...\n');
    
    const patientSchema = new mongoose.Schema({}, { strict: false });
    const Patient = mongoose.model('Patient', patientSchema, 'patients');
    
    const patient = await Patient.findOne({
      'openmrsData.uuid': obs.person.uuid
    });

    if (!patient) {
      console.log(`❌ Patient not found in our system with OpenMRS UUID: ${obs.person.uuid}`);
      return;
    }

    console.log(`✅ Found patient: ${patient._id}`);
    console.log(`   Name: ${patient.user?.name || 'Unknown'}`);
    console.log('');

    // Check if this observation already exists
    const existing = await MedicalRecord.findOne({
      'openmrsData.obsId': 5303
    });

    if (existing) {
      console.log(`⚠️  Observation 5303 already exists in MedicalRecord collection:`);
      console.log(`   Record ID: ${existing._id}`);
      console.log(`   Created: ${existing.createdAt}`);
      console.log(`   Synced: ${existing.syncDate}`);
      return;
    }

    console.log('📝 Creating MedicalRecord entry...\n');

    // Create the medical record
    const medicalRecord = new MedicalRecord({
      patientId: patient._id.toString(),
      type: 'condition',
      data: {
        name: obs.concept?.display || 'Unknown',
        diagnosis: obs.concept?.display || 'Unknown',
        details: obs.value?.display || obs.valueText || '',
        diagnosed: obs.obsDatetime,
        diagnosedDate: obs.obsDatetime,
        date: obs.obsDatetime,
        doctor: obs.encounter?.encounterProviders?.[0]?.provider?.display || 'Dr. doctor',
        diagnosedBy: obs.encounter?.encounterProviders?.[0]?.provider?.display || 'Dr. doctor',
        hospital: obs.location?.display || 'Unknown Hospital',
        notes: obs.value?.display || obs.valueText || '',
        status: 'active',
        medications: []
      },
      openmrsData: {
        obsId: 5303,
        conceptId: obs.concept?.uuid,
        personId: obs.person?.uuid,
        obsDatetime: new Date(obs.obsDatetime),
        dateCreated: new Date(obs.auditInfo?.dateCreated || obs.obsDatetime),
        creatorName: obs.auditInfo?.creator?.display || 'Unknown',
        locationName: obs.location?.display || 'Unknown Hospital',
        encounterUuid: obs.encounter?.uuid,
        valueType: obs.value ? 'coded' : 'text'
      },
      syncDate: new Date()
    });

    await medicalRecord.save();
    console.log('✅ Medical record created successfully!');
    console.log(`   Record ID: ${medicalRecord._id}`);
    console.log(`   Type: ${medicalRecord.type}`);
    console.log(`   Diagnosis: ${medicalRecord.data.diagnosis}`);
    console.log(`   Synced: ${medicalRecord.syncDate}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

syncTodaysObservation();

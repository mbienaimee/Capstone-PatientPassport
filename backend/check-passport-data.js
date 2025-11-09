require('dotenv').config();
const mongoose = require('mongoose');

async function checkPassportData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Betty Williams user
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      role: String
    }));

    const bettyUser = await User.findOne({
      name: /betty.*williams/i,
      role: 'patient'
    });

    if (!bettyUser) {
      console.log('❌ Betty Williams user not found');
      return;
    }

    console.log(`✅ Found Betty Williams user: ${bettyUser._id}\n`);

    // Define schemas first
    const MedicalCondition = mongoose.models.MedicalCondition || mongoose.model('MedicalCondition', new mongoose.Schema({
      patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
      name: String,
      details: String,
      diagnosed: Date,
      createdAt: Date,
      updatedAt: Date
    }));

    const Patient = mongoose.models.Patient || mongoose.model('Patient', new mongoose.Schema({
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      medicalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalCondition' }]
    }));

    const patient = await Patient.findOne({ user: bettyUser._id })
      .populate('medicalHistory');

    if (!patient) {
      console.log('❌ Patient record not found');
      return;
    }

    console.log(`✅ Found Patient record: ${patient._id}`);
    console.log(`📋 Medical History Array Length: ${patient.medicalHistory?.length || 0}\n`);

    // Use already defined MedicalCondition model
    const allConditions = await MedicalCondition.find({ 
      patient: patient._id 
    }).sort({ diagnosed: -1 }).limit(10);

    console.log(`📊 Total Medical Conditions in DB for this patient: ${await MedicalCondition.countDocuments({ patient: patient._id })}\n`);

    console.log('🔍 Most recent 10 medical conditions:');
    allConditions.forEach((cond, index) => {
      const inArray = patient.medicalHistory?.some(h => h._id?.toString() === cond._id.toString());
      console.log(`\n${index + 1}. ${cond.name}`);
      console.log(`   ID: ${cond._id}`);
      console.log(`   Details: ${cond.details}`);
      console.log(`   Diagnosed: ${cond.diagnosed}`);
      console.log(`   Created: ${cond.createdAt}`);
      console.log(`   ⚠️  In medicalHistory array: ${inArray ? '✅ YES' : '❌ NO'}`);
    });

    // Check today's condition specifically
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayConditions = await MedicalCondition.find({
      patient: patient._id,
      diagnosed: { $gte: today }
    });

    console.log(`\n\n🎯 TODAY'S Observations (${today.toISOString().split('T')[0]}):`);
    console.log(`   Count: ${todayConditions.length}\n`);

    if (todayConditions.length > 0) {
      todayConditions.forEach((cond, index) => {
        const inArray = patient.medicalHistory?.some(h => h._id?.toString() === cond._id.toString());
        console.log(`${index + 1}. ${cond.name} - "${cond.details}"`);
        console.log(`   Diagnosed: ${cond.diagnosed}`);
        console.log(`   Created: ${cond.createdAt}`);
        console.log(`   ⚠️  In medicalHistory array: ${inArray ? '✅ YES' : '❌ NO'}`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPassportData();

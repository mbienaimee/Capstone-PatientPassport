require('dotenv').config();
const mongoose = require('mongoose');

async function checkSyncedObservations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const MedicalCondition = mongoose.model('MedicalCondition', new mongoose.Schema({
      patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
      doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      name: String,
      details: String,
      diagnosed: Date,
      createdAt: Date
    }));

    const Patient = mongoose.model('Patient', new mongoose.Schema({
      firstName: String,
      lastName: String
    }));

    // Find Betty Williams
    const bettyWilliams = await Patient.findOne({
      firstName: /betty/i,
      lastName: /williams/i
    });

    if (!bettyWilliams) {
      console.log('❌ Betty Williams not found in database');
      return;
    }

    console.log(`✅ Found Betty Williams (ID: ${bettyWilliams._id})\n`);

    // Check today's observations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysConditions = await MedicalCondition.find({
      patient: bettyWilliams._id,
      diagnosed: { $gte: today }
    }).sort({ diagnosed: -1 });

    console.log(`📊 Medical conditions for TODAY (${today.toISOString().split('T')[0]}):`);
    console.log(`   Count: ${todaysConditions.length}\n`);

    if (todaysConditions.length > 0) {
      todaysConditions.forEach((cond, index) => {
        console.log(`${index + 1}. ${cond.name}`);
        console.log(`   Details: ${cond.details}`);
        console.log(`   Diagnosed: ${cond.diagnosed}`);
        console.log(`   Created: ${cond.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No observations found for today in Patient Passport!\n');
    }

    // Check recent observations
    const recentConditions = await MedicalCondition.find({
      patient: bettyWilliams._id
    }).sort({ diagnosed: -1 }).limit(10);

    console.log('\n📅 Most recent 10 medical conditions:');
    recentConditions.forEach((cond, index) => {
      const daysAgo = Math.floor((Date.now() - new Date(cond.diagnosed).getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${index + 1}. ${cond.name} - ${daysAgo} days ago`);
      console.log(`   Diagnosed: ${cond.diagnosed}`);
    });

    // Total count
    const totalCount = await MedicalCondition.countDocuments({
      patient: bettyWilliams._id
    });

    console.log(`\n📊 Total medical conditions for Betty Williams: ${totalCount}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSyncedObservations();

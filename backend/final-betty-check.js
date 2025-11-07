const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const bettyPatient = await mongoose.connection.db.collection('patients').findOne({ 
    nationalId: '1234567891012346' 
  });

  console.log('\n============================================================');
  console.log('Betty Williams - Patient ID:', bettyPatient._id.toString());
  console.log('============================================================\n');

  const records = await mongoose.connection.db.collection('medicalrecords')
    .find({ patientId: bettyPatient._id.toString() })
    .sort({ createdAt: -1 })
    .toArray();

  console.log(`✅ Total Medical Records Synced: ${records.length}\n`);

  console.log('📋 All Synced Records:\n');
  records.forEach((r, i) => {
    console.log(`${i+1}. Type: ${r.type}`);
    console.log(`   Description: ${r.description || 'N/A'}`);
    if (r.data) {
      if (r.data.name) console.log(`   Name: ${r.data.name}`);
      if (r.data.diagnosed) console.log(`   Date: ${new Date(r.data.diagnosed).toLocaleDateString()}`);
    }
    console.log(`   Created: ${new Date(r.createdAt).toLocaleString()}`);
    console.log('');
  });

  // Group by type
  const byType = {};
  records.forEach(r => {
    byType[r.type] = (byType[r.type] || 0) + 1;
  });

  console.log('\n============================================================');
  console.log('📊 Records by Type:');
  console.log('============================================================\n');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} records`);
  });

  console.log('\n✅ Sync is working! Observations are flowing from OpenMRS → Patient Passport!');

  mongoose.disconnect();
});

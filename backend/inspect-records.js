const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const allRecords = await mongoose.connection.db.collection('medicalrecords').find({}).limit(5).toArray();
  
  console.log('\n📋 Sample Medical Records (showing field structure):\n');
  console.log('Total Records in DB:', await mongoose.connection.db.collection('medicalrecords').countDocuments());
  console.log('');
  
  allRecords.forEach((r, i) => {
    console.log(`Record ${i+1}:`);
    console.log('  _id:', r._id);
    console.log('  type:', r.type);
    console.log('  patientId:', r.patientId);
    console.log('  patient:', r.patient);
    console.log('  date:', r.date);
    console.log('  createdAt:', r.createdAt);
    console.log('  All fields:', Object.keys(r));
    console.log('');
  });
  
  mongoose.disconnect();
});
